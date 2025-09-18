"use client";

/**
 * Profile Component for FleetLink
 * @fileoverview User profile page with personal information and statistics
 */

import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { authAPI, bookingAPI, vehicleAPI } from "@/lib/api";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  User,
  Mail,
  Calendar,
  Truck,
  Clock,
  CheckCircle,
  XCircle,
  Edit,
  Settings,
  ArrowLeft,
} from "lucide-react";
import Link from "next/link";

/**
 * Profile component
 * @returns {JSX.Element} Profile page
 */
const Profile = () => {
  const { user, isAdmin } = useAuth();
  const [userStats, setUserStats] = useState({
    totalBookings: 0,
    activeBookings: 0,
    completedBookings: 0,
    cancelledBookings: 0,
    totalVehicles: 0,
    loading: true,
  });

  /**
   * Fetch user statistics
   */
  useEffect(() => {
    const fetchUserStats = async () => {
      try {
        setUserStats((prev) => ({ ...prev, loading: true }));

        // Fetch user's bookings
        const bookingsResponse = await bookingAPI.getUserBookings();
        const bookings = bookingsResponse.bookings || [];

        // Count bookings by status
        const totalBookings = bookings.length;
        const activeBookings = bookings.filter(
          (b) => b.status === "active"
        ).length;
        const completedBookings = bookings.filter(
          (b) => b.status === "completed"
        ).length;
        const cancelledBookings = bookings.filter(
          (b) => b.status === "cancelled"
        ).length;

        // For regular users, get their vehicle count (if they have any)
        let totalVehicles = 0;
        if (!isAdmin()) {
          try {
            const vehiclesResponse = await vehicleAPI.getUserVehicles();
            totalVehicles = vehiclesResponse.vehicles?.length || 0;
          } catch (error) {
            console.warn("Could not fetch user vehicles:", error);
            totalVehicles = 0;
          }
        }

        setUserStats({
          totalBookings,
          activeBookings,
          completedBookings,
          cancelledBookings,
          totalVehicles,
          loading: false,
        });
      } catch (error) {
        console.error("Error fetching user stats:", error);
        setUserStats((prev) => ({ ...prev, loading: false }));
      }
    };

    fetchUserStats();
  }, [isAdmin]);

  /**
   * Get user initials for avatar
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
   * Format date
   */
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-4">
            <Button
              variant="outline"
              asChild
              className="flex items-center space-x-2"
            >
              <Link href="/dashboard">
                <ArrowLeft className="h-4 w-4" />
                <span>Back to Dashboard</span>
              </Link>
            </Button>
          </div>
          <div>
            <h1 className="text-4xl font-bold text-slate-800 mb-2">
              My Profile
            </h1>
            <p className="text-slate-600 text-lg">
              View and manage your account information
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Information */}
          <div className="lg:col-span-1">
            <Card className="border-0 shadow-lg">
              <CardHeader className="text-center">
                <div className="flex justify-center mb-4">
                  <Avatar className="h-24 w-24">
                    <AvatarFallback className="text-2xl font-semibold bg-blue-100 text-blue-600">
                      {getUserInitials()}
                    </AvatarFallback>
                  </Avatar>
                </div>
                <CardTitle className="text-2xl text-slate-800">
                  {user?.name || "User"}
                </CardTitle>
                <CardDescription className="text-slate-600">
                  {user?.email || "user@example.com"}
                </CardDescription>
                {isAdmin() && (
                  <Badge className="bg-blue-100 text-blue-800 px-3 py-1">
                    Administrator
                  </Badge>
                )}
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center space-x-3">
                  <User className="h-5 w-5 text-slate-500" />
                  <div>
                    <p className="text-sm font-medium text-slate-800">Name</p>
                    <p className="text-sm text-slate-600">
                      {user?.name || "N/A"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Mail className="h-5 w-5 text-slate-500" />
                  <div>
                    <p className="text-sm font-medium text-slate-800">Email</p>
                    <p className="text-sm text-slate-600">
                      {user?.email || "N/A"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Calendar className="h-5 w-5 text-slate-500" />
                  <div>
                    <p className="text-sm font-medium text-slate-800">
                      Member Since
                    </p>
                    <p className="text-sm text-slate-600">
                      {formatDate(user?.createdAt)}
                    </p>
                  </div>
                </div>
                <div className="pt-4 border-t border-slate-200">
                  <Button asChild className="w-full">
                    <Link href="/settings">
                      <Settings className="mr-2 h-4 w-4" />
                      Account Settings
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Statistics */}
          <div className="lg:col-span-2">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Booking Statistics */}
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center text-xl text-slate-800">
                    <Clock className="h-5 w-5 mr-2" />
                    Booking Statistics
                  </CardTitle>
                  <CardDescription className="text-slate-600">
                    Your booking activity overview
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {userStats.loading ? (
                    <div className="text-center py-4">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                      <p className="text-slate-500 mt-2">Loading...</p>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-600">Total Bookings</span>
                        <span className="font-semibold text-slate-800">
                          {userStats.totalBookings}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-600">Active Bookings</span>
                        <span className="font-semibold text-blue-600">
                          {userStats.activeBookings}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-600">Completed</span>
                        <span className="font-semibold text-green-600">
                          {userStats.completedBookings}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-slate-600">Cancelled</span>
                        <span className="font-semibold text-red-600">
                          {userStats.cancelledBookings}
                        </span>
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>

              {/* Vehicle Statistics (for regular users) */}
              {!isAdmin() && (
                <Card className="border-0 shadow-lg">
                  <CardHeader>
                    <CardTitle className="flex items-center text-xl text-slate-800">
                      <Truck className="h-5 w-5 mr-2" />
                      Vehicle Statistics
                    </CardTitle>
                    <CardDescription className="text-slate-600">
                      Your contributed vehicles
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {userStats.loading ? (
                      <div className="text-center py-4">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                        <p className="text-slate-500 mt-2">Loading...</p>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-600">Total Vehicles</span>
                          <span className="font-semibold text-slate-800">
                            {userStats.totalVehicles}
                          </span>
                        </div>
                        <div className="pt-4 border-t border-slate-200">
                          <Button asChild variant="outline" className="w-full">
                            <Link href="/add-vehicle">
                              <Truck className="mr-2 h-4 w-4" />
                              Add Vehicle
                            </Link>
                          </Button>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* Quick Actions */}
              <Card className="border-0 shadow-lg md:col-span-2">
                <CardHeader>
                  <CardTitle className="text-xl text-slate-800">
                    Quick Actions
                  </CardTitle>
                  <CardDescription className="text-slate-600">
                    Common tasks and navigation
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Button asChild variant="outline" className="h-auto p-4">
                      <Link href="/search">
                        <div className="text-center">
                          <Truck className="h-6 w-6 mx-auto mb-2" />
                          <p className="font-medium">Search Vehicles</p>
                          <p className="text-xs text-slate-500">
                            Find available vehicles
                          </p>
                        </div>
                      </Link>
                    </Button>
                    <Button asChild variant="outline" className="h-auto p-4">
                      <Link href="/bookings">
                        <div className="text-center">
                          <Clock className="h-6 w-6 mx-auto mb-2" />
                          <p className="font-medium">My Bookings</p>
                          <p className="text-xs text-slate-500">
                            Manage bookings
                          </p>
                        </div>
                      </Link>
                    </Button>
                    <Button asChild variant="outline" className="h-auto p-4">
                      <Link href="/settings">
                        <div className="text-center">
                          <Settings className="h-6 w-6 mx-auto mb-2" />
                          <p className="font-medium">Settings</p>
                          <p className="text-xs text-slate-500">
                            Account settings
                          </p>
                        </div>
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
