import { createContext, useContext, useState, useEffect } from "react";
import organizationsApi from "../api/organizations";
import projectsApi from "../api/projects";
import integrationsApi from "../api/integrations";

const OrgContext = createContext(null);

const DEFAULT_ENVIRONMENTS = [
  { _id: "development", name: "DEVELOPMENT", status: "ACTIVE" },
  { _id: "staging", name: "STAGING", status: "ACTIVE" },
  { _id: "production", name: "PRODUCTION", status: "ACTIVE" },
  { _id: "test", name: "TEST", status: "ACTIVE" },
];

export function OrgProvider({ children }) {
  const [organizations, setOrganizations] = useState([]);
  const [activeOrg, setActiveOrg] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const [projects, setProjects] = useState([]);
  const [activeProject, setActiveProject] = useState(null);

  // Hierarchy resources: Environment, Integration, Upstream API
  const [integrations, setIntegrations] = useState([]);
  const [activeIntegration, setActiveIntegration] = useState(null);
  const [environments, setEnvironments] = useState(DEFAULT_ENVIRONMENTS);
  const [activeEnvironment, setActiveEnvironment] = useState(DEFAULT_ENVIRONMENTS[2]); // Default to PRODUCTION or DEVELOPMENT
  const [upstreamApis, setUpstreamApis] = useState([]);
  const [activeUpstreamApi, setActiveUpstreamApi] = useState(null);

  const clearHierarchyResources = () => {
    setIntegrations([]);
    setActiveIntegration(null);
    setEnvironments(DEFAULT_ENVIRONMENTS);
    setActiveEnvironment(DEFAULT_ENVIRONMENTS[2]);
    setUpstreamApis([]);
    setActiveUpstreamApi(null);
  };

  const syncUpstreamApis = (integ, env) => {
    if (!integ || !env) {
      setUpstreamApis([]);
      setActiveUpstreamApi(null);
      return;
    }

    const matchedEnv = (integ.environments || []).find(
      (e) => (e.name || "").toUpperCase() === (env.name || "").toUpperCase()
    );
    const apis = matchedEnv?.upstreamApis || [];
    setUpstreamApis(apis);

    const savedApiId = localStorage.getItem("apiShield_activeUpstreamApiId");
    const savedApi = apis.find((a) => a._id === savedApiId);
    const nextApi = savedApi || apis[0] || null;
    setActiveUpstreamApi(nextApi);
    if (nextApi) {
      localStorage.setItem("apiShield_activeUpstreamApiId", nextApi._id);
    } else {
      localStorage.removeItem("apiShield_activeUpstreamApiId");
    }
  };

  const fetchHierarchyResources = async (organizationId, projectId) => {
    if (!organizationId || !projectId) {
      clearHierarchyResources();
      return;
    }

    try {
      const response = await integrationsApi.getAll(organizationId, projectId);
      const integrationList = response.data?.data || [];
      setIntegrations(integrationList);

      // Extract all environments across integrations, combined with default environments
      const envMap = new Map();
      DEFAULT_ENVIRONMENTS.forEach((def) => {
        envMap.set(def.name.toUpperCase(), { ...def });
      });

      integrationList.forEach((integ) => {
        (integ.environments || []).forEach((env) => {
          const upper = (env.name || "").toUpperCase();
          envMap.set(upper, {
            _id: env._id,
            name: env.name || upper,
            status: env.status || "ACTIVE",
            integrationId: integ._id,
          });
        });
      });

      const allEnvs = Array.from(envMap.values());
      setEnvironments(allEnvs);

      // Restore or select active environment
      const savedEnvName = localStorage.getItem("apiShield_activeEnvName");
      const savedEnv = allEnvs.find(
        (e) => (e.name || "").toUpperCase() === (savedEnvName || "").toUpperCase()
      );
      const nextEnv = savedEnv || allEnvs.find(e => e.name.toUpperCase() === "PRODUCTION") || allEnvs[0];
      setActiveEnvironment(nextEnv);
      if (nextEnv) {
        localStorage.setItem("apiShield_activeEnvName", nextEnv.name);
      }

      // Restore or select active integration
      const savedIntegId = localStorage.getItem("apiShield_activeIntegrationId");
      const savedInteg = integrationList.find((i) => i._id === savedIntegId);
      const nextInteg = savedInteg || integrationList[0] || null;
      setActiveIntegration(nextInteg);
      if (nextInteg) {
        localStorage.setItem("apiShield_activeIntegrationId", nextInteg._id);
      } else {
        localStorage.removeItem("apiShield_activeIntegrationId");
      }

      // Extract upstream APIs
      syncUpstreamApis(nextInteg, nextEnv);
    } catch {
      // If error or empty, fallback gracefully
      clearHierarchyResources();
    }
  };

  const fetchProjects = async (organizationId) => {
    if (!organizationId) {
      setProjects([]);
      setActiveProject(null);
      clearHierarchyResources();
      return [];
    }

    try {
      const response = await projectsApi.getAll(organizationId);
      const authorizedProjects = response.data?.data || [];
      setProjects(authorizedProjects);

      const savedProjectId = localStorage.getItem("apiShield_activeProjectId");
      const savedProject = authorizedProjects.find(
        (project) => project._id === savedProjectId
      );
      const nextProject = savedProject || authorizedProjects[0] || null;
      setActiveProject(nextProject);
      if (nextProject) {
        localStorage.setItem("apiShield_activeProjectId", nextProject._id);
        await fetchHierarchyResources(organizationId, nextProject._id);
      } else {
        localStorage.removeItem("apiShield_activeProjectId");
        clearHierarchyResources();
      }
      return authorizedProjects;
    } catch {
      setProjects([]);
      setActiveProject(null);
      clearHierarchyResources();
      return [];
    }
  };

  const fetchOrganizations = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await organizationsApi.getAll();
      const orgs = response.data?.data || [];
      setOrganizations(orgs);

      // Persist user's selected active organization across page refreshes
      const savedOrgId = localStorage.getItem("apiShield_activeOrgId");
      const savedOrg = orgs.find((org) => org._id === savedOrgId);

      if (savedOrg) {
        setActiveOrg(savedOrg);
        await fetchProjects(savedOrg._id);
      } else if (orgs.length > 0) {
        setActiveOrg(orgs[0]);
        localStorage.setItem("apiShield_activeOrgId", orgs[0]._id);
        await fetchProjects(orgs[0]._id);
      } else {
        setActiveOrg(null);
        setProjects([]);
        setActiveProject(null);
        clearHierarchyResources();
      }
    } catch {
      setError("Failed to load organizations.");
    } finally {
      setIsLoading(false);
    }
  };

  const switchOrg = async (org) => {
    if (!org) return;
    setActiveOrg(org);
    localStorage.setItem("apiShield_activeOrgId", org._id);
    localStorage.removeItem("apiShield_activeProjectId");
    localStorage.removeItem("apiShield_activeIntegrationId");
    localStorage.removeItem("apiShield_activeUpstreamApiId");
    setActiveProject(null);
    clearHierarchyResources();
    await fetchProjects(org._id);
  };

  const switchProject = async (project) => {
    if (!project) {
      setActiveProject(null);
      localStorage.removeItem("apiShield_activeProjectId");
      clearHierarchyResources();
      return;
    }
    setActiveProject(project);
    localStorage.setItem("apiShield_activeProjectId", project._id);
    localStorage.removeItem("apiShield_activeIntegrationId");
    localStorage.removeItem("apiShield_activeUpstreamApiId");
    setActiveIntegration(null);
    setUpstreamApis([]);
    setActiveUpstreamApi(null);
    if (activeOrg?._id) {
      await fetchHierarchyResources(activeOrg._id, project._id);
    }
  };

  const switchEnvironment = (env) => {
    if (!env) return;
    setActiveEnvironment(env);
    localStorage.setItem("apiShield_activeEnvName", env.name);
    
    // Check if activeIntegration contains this environment; if not, find one or reset
    const matchedEnvName = (env.name || "").toUpperCase();
    const hasEnv = (activeIntegration?.environments || []).some(
      (e) => (e.name || "").toUpperCase() === matchedEnvName
    );
    let nextInteg = activeIntegration;
    if (!hasEnv) {
      const validInteg = integrations.find((integ) =>
        (integ.environments || []).some(
          (e) => (e.name || "").toUpperCase() === matchedEnvName
        )
      );
      nextInteg = validInteg || integrations[0] || null;
      setActiveIntegration(nextInteg);
      if (nextInteg) {
        localStorage.setItem("apiShield_activeIntegrationId", nextInteg._id);
      } else {
        localStorage.removeItem("apiShield_activeIntegrationId");
      }
    }
    syncUpstreamApis(nextInteg, env);
  };

  const switchIntegration = (integ) => {
    setActiveIntegration(integ);
    if (integ?._id) {
      localStorage.setItem("apiShield_activeIntegrationId", integ._id);
    } else {
      localStorage.removeItem("apiShield_activeIntegrationId");
    }
    syncUpstreamApis(integ, activeEnvironment);
  };

  const switchUpstreamApi = (api) => {
    setActiveUpstreamApi(api);
    if (api?._id) {
      localStorage.setItem("apiShield_activeUpstreamApiId", api._id);
    } else {
      localStorage.removeItem("apiShield_activeUpstreamApiId");
    }
  };

  const addOrg = (org) => {
    setOrganizations((prev) => [...prev, org]);
    switchOrg(org);
  };

  const updateOrg = (updatedOrg) => {
    setOrganizations((prev) =>
      prev.map((org) => (org._id === updatedOrg._id ? { ...org, ...updatedOrg } : org))
    );
    setActiveOrg((prev) => (prev?._id === updatedOrg._id ? { ...prev, ...updatedOrg } : prev));
  };

  const removeOrg = (orgId) => {
    setOrganizations((prev) => {
      const remaining = prev.filter((org) => org._id !== orgId);
      if (activeOrg?._id === orgId) {
        if (remaining.length > 0) {
          switchOrg(remaining[0]);
        } else {
          setActiveOrg(null);
          localStorage.removeItem("apiShield_activeOrgId");
          setProjects([]);
          setActiveProject(null);
          clearHierarchyResources();
        }
      }
      return remaining;
    });
  };

  const addProject = (project) => {
    setProjects((prev) => [...prev, project]);
    switchProject(project);
  };

  const updateProject = (updatedProject) => {
    setProjects((prev) =>
      prev.map((p) => (p._id === updatedProject._id ? { ...p, ...updatedProject } : p))
    );
    setActiveProject((prev) => (prev?._id === updatedProject._id ? { ...prev, ...updatedProject } : prev));
  };

  const removeProject = (projectId) => {
    setProjects((prev) => {
      const remaining = prev.filter((p) => p._id !== projectId);
      if (activeProject?._id === projectId) {
        if (remaining.length > 0) {
          switchProject(remaining[0]);
        } else {
          setActiveProject(null);
          localStorage.removeItem("apiShield_activeProjectId");
          clearHierarchyResources();
        }
      }
      return remaining;
    });
  };

  return (
    <OrgContext.Provider
      value={{
        organizations,
        activeOrg,
        isLoading,
        error,
        fetchOrganizations,
        switchOrg,
        addOrg,
        updateOrg,
        removeOrg,
        projects,
        activeProject,
        fetchProjects,
        switchProject,
        addProject,
        updateProject,
        removeProject,
        environments,
        activeEnvironment,
        switchEnvironment,
        integrations,
        activeIntegration,
        switchIntegration,
        upstreamApis,
        activeUpstreamApi,
        switchUpstreamApi,
        fetchHierarchyResources,
      }}
    >
      {children}
    </OrgContext.Provider>
  );
}

export function useOrg() {
  const context = useContext(OrgContext);
  if (!context) {
    throw new Error("useOrg must be used inside <OrgProvider>");
  }
  return context;
}
