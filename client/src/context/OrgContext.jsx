import { createContext, useContext, useState } from "react";
import organizationsApi from "../api/organizations";

const OrgContext = createContext(null);

export function OrgProvider({ children }) {
  const [organizations, setOrganizations] = useState([]);
  const [activeOrg, setActiveOrg] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchOrganizations = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await organizationsApi.getAll();
      const orgs = response.data.data;
      setOrganizations(orgs);

      // Persist user's selected active organization across page refreshes
      const savedOrgId = localStorage.getItem("apiShield_activeOrgId");
      const savedOrg = orgs.find((org) => org._id === savedOrgId);

      if (savedOrg) {
        setActiveOrg(savedOrg);
      } else if (orgs.length > 0) {
        setActiveOrg(orgs[0]);
        localStorage.setItem("apiShield_activeOrgId", orgs[0]._id);
      } else {
        setActiveOrg(null);
      }
    } catch (err) {
      setError("Failed to load organizations.");
    } finally {
      setIsLoading(false);
    }
  };

  const switchOrg = (org) => {
    setActiveOrg(org);
    localStorage.setItem("apiShield_activeOrgId", org._id);
  };

  const addOrg = (org) => {
    setOrganizations((prev) => [...prev, org]);
    switchOrg(org);
  };

  return (
    <OrgContext.Provider value={{
      organizations,
      activeOrg,
      isLoading,
      error,
      fetchOrganizations,
      switchOrg,
      addOrg,
    }}>
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
