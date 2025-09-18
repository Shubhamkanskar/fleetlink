"use client";

/**
 * Navigation Component for FleetLink
 * @fileoverview Beautiful navigation with role-based menu items and user dropdown
 */

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { notificationAPI } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import {
  Truck,
  Search,
  Calendar,
  Settings,
  LogOut,
  User,
  Shield,
  Menu,
  X,
  BarChart3,
  Plus,
  Bell,
} from "lucide-react";

/**
 * Navigation component
 * @returns {JSX.Element} Navigation bar
 */
const Navigation = () => {
  const { user, logout, isAdmin } = useAuth();
  const pathname = usePathname();
  const router = useRouter();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  /**
   * Fetch unread notification count
   */
  const fetchUnreadCount = async () => {
    try {
      const response = await notificationAPI.getUnreadCount();
      setUnreadCount(response.unreadCount || 0);
    } catch (error) {
      console.error("Failed to fetch unread count:", error);
    }
  };

  /**
   * Handle logout
   */
  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  // Fetch unread count when user changes
  useEffect(() => {
    if (user) {
      fetchUnreadCount();
      // Refresh every 30 seconds
      const interval = setInterval(fetchUnreadCount, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  /**
   * Check if a route is active
   * @param {string} path - Route path
   * @returns {boolean} True if route is active
   */
  const isActiveRoute = (path) => {
    return pathname === path;
  };

  /**
   * Navigation items for regular users
   */
  const userNavItems = [
    {
      path: "/dashboard",
      label: "Dashboard",
      icon: <Truck className="h-4 w-4" />,
    },
    {
      path: "/search",
      label: "Search Vehicles",
      icon: <Search className="h-4 w-4" />,
    },
    {
      path: "/add-vehicle",
      label: "Add Vehicle",
      icon: <Plus className="h-4 w-4" />,
    },
    {
      path: "/bookings",
      label: "My Bookings",
      icon: <Calendar className="h-4 w-4" />,
    },
    {
      path: "/notifications",
      label: "Notifications",
      icon: <Bell className="h-4 w-4" />,
    },
  ];

  /**
   * Navigation items for admin users
   */
  const adminNavItems = [
    {
      path: "/admin/vehicles",
      label: "Manage Vehicles",
      icon: <Truck className="h-4 w-4" />,
    },
    {
      path: "/admin/bookings",
      label: "All Bookings",
      icon: <Calendar className="h-4 w-4" />,
    },
    {
      path: "/admin/stats",
      label: "Statistics",
      icon: <BarChart3 className="h-4 w-4" />,
    },
  ];

  /**
   * Get user initials for avatar
   * @returns {string} User initials
   */
  const getUserInitials = () => {
    if (!user?.name) return "U";
    return user.name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  /**
   * Get navigation items based on user role
   * @returns {Array} Navigation items
   */
  const getNavItems = () => {
    return isAdmin() ? adminNavItems : userNavItems;
  };

  return (
    <nav className="bg-white/95 backdrop-blur-sm shadow-sm border-b border-slate-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo and brand */}
          <div className="flex items-center">
            <Link href="/dashboard" className="flex items-center space-x-2">
              <div className="p-2 bg-blue-600 rounded-lg">
                <Truck className="h-6 w-6 text-white" />
              </div>
              <span className="text-xl font-bold text-slate-800">
                FleetLink
              </span>
            </Link>
          </div>

          {/* Desktop navigation */}
          <div className="hidden md:flex items-center space-x-8">
            {getNavItems().map((item) => (
              <Link
                key={item.path}
                href={item.path}
                className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-all duration-200 ${
                  isActiveRoute(item.path)
                    ? "bg-blue-100 text-blue-700 shadow-sm"
                    : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
                {item.path === "/notifications" && unreadCount > 0 && (
                  <Badge
                    variant="destructive"
                    className="ml-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
                  >
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </Badge>
                )}
              </Link>
            ))}
          </div>

          {/* User menu */}
          <div className="flex items-center space-x-4">
            {/* Admin badge */}
            {isAdmin() && (
              <Badge
                variant="secondary"
                className="hidden sm:flex items-center space-x-1 bg-blue-100 text-blue-800"
              >
                <Shield className="h-3 w-3" />
                <span>Admin</span>
              </Badge>
            )}

            {/* User dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  className="relative h-8 w-8 rounded-full"
                >
                  <Avatar className="h-8 w-8">
                    <AvatarFallback className="bg-blue-100 text-blue-700 font-semibold">
                      {getUserInitials()}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">
                      {user?.name}
                    </p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user?.email}
                    </p>
                    {isAdmin() && (
                      <Badge
                        variant="secondary"
                        className="w-fit text-xs bg-blue-100 text-blue-800"
                      >
                        <Shield className="h-3 w-3 mr-1" />
                        Admin
                      </Badge>
                    )}
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link
                    href="/profile"
                    className="flex items-center cursor-pointer"
                  >
                    <User className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link
                    href="/settings"
                    className="flex items-center cursor-pointer"
                  >
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="text-red-600 cursor-pointer"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Mobile menu button */}
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? (
                <X className="h-5 w-5" />
              ) : (
                <Menu className="h-5 w-5" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile navigation */}
        {isMobileMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 border-t border-slate-200 bg-white/95 backdrop-blur-sm">
              {getNavItems().map((item) => (
                <Link
                  key={item.path}
                  href={item.path}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-md text-base font-medium transition-all duration-200 ${
                    isActiveRoute(item.path)
                      ? "bg-blue-100 text-blue-700"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                  }`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {item.icon}
                  <span>{item.label}</span>
                  {item.path === "/notifications" && unreadCount > 0 && (
                    <Badge
                      variant="destructive"
                      className="ml-auto h-5 w-5 flex items-center justify-center p-0 text-xs"
                    >
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </Badge>
                  )}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navigation;
