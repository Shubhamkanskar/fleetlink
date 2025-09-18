"use client";

/**
 * Dashboard Component for FleetLink
 * @fileoverview Beautiful dashboard with role-based content and quick actions
 */

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { vehicleAPI, bookingAPI } from "@/lib/api";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Truck,
  Search,
  Calendar,
  Plus,
  BarChart3,
  Users,
  Clock,
  CheckCircle,
  TrendingUp,
  Activity,
  Loader2,
} from "lucide-react";

/**
 * Dashboard component
 * @returns {JSX.Element} Dashboard page
 */
const Dashboard = () => {
  const { user, isAdmin } = useAuth();
  const [stats, setStats] = useState({
    totalVehicles: 0,
    activeBookings: 0,
    completedToday: 0,
    availableVehicles: 0,
    loading: true,
    error: null,
  });

  /**
   * Fetch dashboard statistics
   */
  useEffect(() => {
    const fetchStats = async () => {
      try {
        setStats((prev) => ({ ...prev, loading: true, error: null }));

        // Fetch vehicle statistics based on user role
        let vehicleStats = {};
        if (isAdmin()) {
          // Admin: Get full vehicle statistics
          try {
            const vehicleStatsResponse = await vehicleAPI.getVehicleStats();
            vehicleStats = vehicleStatsResponse.stats?.vehicles || {};
          } catch (error) {
            console.warn("Could not fetch vehicle stats:", error);
          }
        } else {
          // Regular user: Get available vehicles count
          try {
            // Set future dates for availability check
            const futureStart = new Date();
            futureStart.setDate(futureStart.getDate() + 1); // Tomorrow
            const futureEnd = new Date();
            futureEnd.setDate(futureEnd.getDate() + 2); // Day after tomorrow

            const availableVehiclesResponse =
              await vehicleAPI.getAvailableVehicles({
                startTime: futureStart.toISOString(),
                endTime: futureEnd.toISOString(),
              });
            const availableCount =
              availableVehiclesResponse.availableCount || 0;
            vehicleStats = {
              total: availableCount, // Show available count as total for users
              active: availableCount,
            };
          } catch (error) {
            console.warn("Could not fetch available vehicles:", error);
            vehicleStats = { total: 0, active: 0 };
          }
        }

        // Fetch booking data based on user role
        let userBookings = [];
        let bookingStats = {};

        if (isAdmin()) {
          // Admin: Get system-wide booking statistics
          try {
            const bookingStatsResponse = await bookingAPI.getBookingStats();
            bookingStats = bookingStatsResponse.stats || {};
          } catch (error) {
            console.warn("Could not fetch booking stats:", error);
          }
        } else {
          // Regular user: Get their own bookings
          try {
            const userBookingsResponse = await bookingAPI.getUserBookings();
            userBookings = userBookingsResponse.bookings || [];
          } catch (error) {
            console.warn("Could not fetch user bookings:", error);
          }
        }

        // Calculate stats based on user role
        const activeBookings = isAdmin()
          ? bookingStats.active || 0
          : userBookings.filter((booking) => booking.status === "active")
              .length;

        const completedToday = isAdmin()
          ? bookingStats.todayBookings || 0
          : userBookings.filter((booking) => {
              const today = new Date();
              const bookingDate = new Date(booking.createdAt);
              return (
                bookingDate.toDateString() === today.toDateString() &&
                booking.status === "completed"
              );
            }).length;

        setStats({
          totalVehicles: vehicleStats.total || 0,
          activeBookings,
          completedToday,
          availableVehicles: vehicleStats.active || 0,
          loading: false,
          error: null,
        });
      } catch (error) {
        console.error("Error fetching dashboard stats:", error);
        setStats((prev) => ({
          ...prev,
          loading: false,
          error: "Failed to load dashboard data",
        }));
      }
    };

    fetchStats();
  }, [isAdmin]);

  /**
   * Quick action cards for regular users
   */
  const userQuickActions = [
    {
      title: "Search Vehicles",
      description: "Find available vehicles for your logistics needs",
      icon: <Search className="h-6 w-6" />,
      link: "/search",
      color: "bg-gradient-to-br from-blue-500 to-blue-600",
      hoverColor: "hover:from-blue-600 hover:to-blue-700",
    },
    {
      title: "My Bookings",
      description: "View and manage your vehicle bookings",
      icon: <Calendar className="h-6 w-6" />,
      link: "/bookings",
      color: "bg-gradient-to-br from-green-500 to-green-600",
      hoverColor: "hover:from-green-600 hover:to-green-700",
    },
  ];

  /**
   * Quick action cards for admin users
   */
  const adminQuickActions = [
    {
      title: "Manage Vehicles",
      description: "Add, edit, and manage fleet vehicles",
      icon: <Truck className="h-6 w-6" />,
      link: "/admin/vehicles",
      color: "bg-gradient-to-br from-blue-500 to-blue-600",
      hoverColor: "hover:from-blue-600 hover:to-blue-700",
    },
    {
      title: "All Bookings",
      description: "View and manage all system bookings",
      icon: <Calendar className="h-6 w-6" />,
      link: "/admin/bookings",
      color: "bg-gradient-to-br from-green-500 to-green-600",
      hoverColor: "hover:from-green-600 hover:to-green-700",
    },
    {
      title: "Statistics",
      description: "View system analytics and reports",
      icon: <BarChart3 className="h-6 w-6" />,
      link: "/admin/stats",
      color: "bg-gradient-to-br from-purple-500 to-purple-600",
      hoverColor: "hover:from-purple-600 hover:to-purple-700",
    },
  ];

  /**
   * Get quick actions based on user role
   * @returns {Array} Quick action items
   */
  const getQuickActions = () => {
    return isAdmin() ? adminQuickActions : userQuickActions;
  };

  /**
   * Get welcome message based on time of day
   * @returns {string} Welcome message
   */
  const getWelcomeMessage = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome section */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-slate-800 mb-2">
                {getWelcomeMessage()}, {user?.name}! 👋
              </h1>
              <p className="text-slate-600 text-lg">
                Welcome to FleetLink - your logistics vehicle booking system
              </p>
            </div>
            {isAdmin() && (
              <Badge
                variant="secondary"
                className="bg-blue-100 text-blue-800 px-4 py-2 text-sm"
              >
                <Users className="h-4 w-4 mr-2" />
                Administrator
              </Badge>
            )}
          </div>
        </div>

        {/* Quick actions */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-slate-800 mb-6">
            Quick Actions
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {getQuickActions().map((action, index) => (
              <Card
                key={index}
                className="group hover:shadow-xl transition-all duration-300 border-0 shadow-lg"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center space-x-4">
                    <div
                      className={`p-3 rounded-xl ${action.color} ${action.hoverColor} transition-all duration-300 group-hover:scale-110`}
                    >
                      {action.icon}
                    </div>
                    <div>
                      <CardTitle className="text-lg text-slate-800">
                        {action.title}
                      </CardTitle>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <CardDescription className="mb-4 text-slate-600">
                    {action.description}
                  </CardDescription>
                  <Button
                    asChild
                    className="w-full bg-slate-800 hover:bg-slate-900 text-white transition-all duration-200"
                  >
                    <Link href={action.link}>{action.title}</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Stats overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">
                {isAdmin() ? "Total Vehicles" : "Available Vehicles"}
              </CardTitle>
              <div className="p-2 bg-blue-100 rounded-lg">
                <Truck className="h-4 w-4 text-blue-600" />
              </div>
            </CardHeader>
            <CardContent>
              {stats.loading ? (
                <div className="flex items-center space-x-2">
                  <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
                  <span className="text-slate-400">Loading...</span>
                </div>
              ) : (
                <>
                  <div className="text-3xl font-bold text-slate-800">
                    {isAdmin() ? stats.totalVehicles : stats.availableVehicles}
                  </div>
                  <p className="text-xs text-slate-500 flex items-center mt-1">
                    <Activity className="h-3 w-3 mr-1 text-blue-500" />
                    {isAdmin() ? "Fleet vehicles" : "Ready for booking"}
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">
                {isAdmin() ? "Active Bookings" : "My Active Bookings"}
              </CardTitle>
              <div className="p-2 bg-orange-100 rounded-lg">
                <Clock className="h-4 w-4 text-orange-600" />
              </div>
            </CardHeader>
            <CardContent>
              {stats.loading ? (
                <div className="flex items-center space-x-2">
                  <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
                  <span className="text-slate-400">Loading...</span>
                </div>
              ) : (
                <>
                  <div className="text-3xl font-bold text-slate-800">
                    {stats.activeBookings}
                  </div>
                  <p className="text-xs text-slate-500 flex items-center mt-1">
                    <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
                    {isAdmin() ? "Currently active" : "Your active bookings"}
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">
                {isAdmin() ? "Completed Today" : "My Completed Today"}
              </CardTitle>
              <div className="p-2 bg-green-100 rounded-lg">
                <CheckCircle className="h-4 w-4 text-green-600" />
              </div>
            </CardHeader>
            <CardContent>
              {stats.loading ? (
                <div className="flex items-center space-x-2">
                  <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
                  <span className="text-slate-400">Loading...</span>
                </div>
              ) : (
                <>
                  <div className="text-3xl font-bold text-slate-800">
                    {stats.completedToday}
                  </div>
                  <p className="text-xs text-slate-500 flex items-center mt-1">
                    <CheckCircle className="h-3 w-3 mr-1 text-green-500" />
                    {isAdmin()
                      ? "Today's completions"
                      : "Your completed bookings"}
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-slate-600">
                {isAdmin() ? "Available Vehicles" : "Total Bookings"}
              </CardTitle>
              <div className="p-2 bg-purple-100 rounded-lg">
                <Search className="h-4 w-4 text-purple-600" />
              </div>
            </CardHeader>
            <CardContent>
              {stats.loading ? (
                <div className="flex items-center space-x-2">
                  <Loader2 className="h-6 w-6 animate-spin text-slate-400" />
                  <span className="text-slate-400">Loading...</span>
                </div>
              ) : (
                <>
                  <div className="text-3xl font-bold text-slate-800">
                    {isAdmin()
                      ? stats.availableVehicles
                      : stats.activeBookings + stats.completedToday}
                  </div>
                  <p className="text-xs text-slate-500 flex items-center mt-1">
                    <Activity className="h-3 w-3 mr-1 text-blue-500" />
                    {isAdmin() ? "Ready for booking" : "All your bookings"}
                  </p>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
