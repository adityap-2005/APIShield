/**
 * OrgContext.jsx
 *
 * Manages the "active organization" that the user is currently working in.
 *
 * Why this is needed:
 * - A user can be a member of multiple organizations.
 * - Most pages (teams, members, API keys, audit logs) are scoped to ONE organization.
 * - This context stores which organization is currently selected.
 *
 * The selected organizationId is persisted in localStorage so it survives page refresh.
 */

import { createContext, useContext, useState, useEffect } from "react";
import organizationsApi from "../api/organizations";

const OrgContext = createContext(null);

export function OrgProvider({ children }) {
  // List of all organizations the user belongs to
  const [organizations, setOrganizations] = useState([]);
  // The currently active organization object
  const [activeOrg, setActiveOrg] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // Fetch all organizations the current user belongs to
  const fetchOrganizations = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await organizationsApi.getAll();
      const orgs = response.data.data;
      setOrganizations(orgs);

      // Try to restore the previously selected org from localStorage
      const savedOrgId = localStorage.getItem("apiShield_activeOrgId");
      const savedOrg = orgs.find((org) => org._id === savedOrgId);

      if (savedOrg) {
        setActiveOrg(savedOrg);
      } else if (orgs.length > 0) {
        // Default to the first organization
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

  // Switch the active organization
  const switchOrg = (org) => {
    setActiveOrg(org);
    localStorage.setItem("apiShield_activeOrgId", org._id);
  };

  // Add a newly created organization to the list and switch to it
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
