import { useQuery } from "@tanstack/react-query";

export type UserRole = "citizen" | "officer" | "supervisor" | "administrator";

interface User {
  id: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  profileImageUrl?: string;
  employeeId?: string;
  role: UserRole;
  circleId?: number;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export function useAuth() {
  const { data: user, isLoading } = useQuery<User>({
    queryKey: ["/api/auth/user"],
    retry: false,
  });

  const isCitizen = user?.role === "citizen";
  const isOfficer = user?.role === "officer";
  const isSupervisor = user?.role === "supervisor";
  const isAdministrator = user?.role === "administrator";
  
  // Check if user has administrative privileges (admin or supervisor)
  const hasAdminAccess = isAdministrator || isSupervisor;
  
  // Check if user is staff member (not a citizen)
  const isStaffMember = isOfficer || isSupervisor || isAdministrator;

  return {
    user,
    isLoading,
    isAuthenticated: !!user,
    role: user?.role,
    isCitizen,
    isOfficer,
    isSupervisor,
    isAdministrator,
    hasAdminAccess,
    isStaffMember,
  };
}
