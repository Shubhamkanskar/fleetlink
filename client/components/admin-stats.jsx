"use client";

/**
 * Admin Statistics Component for FleetLink
 * @fileoverview Comprehensive system statistics and analytics dashboard
 */

import React, { useState, useEffect } from "react";
import { vehicleAPI, bookingAPI } from "@/lib/api";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Truck,
  Calendar,
  Users,
  TrendingUp,
  BarChart3,
  RefreshCw,
  Loader2,
  CheckCircle,
  AlertCircle,
  Clock,
  Activity,
} from "lucide-react";

/**
 * Admin statistics component
 * @returns {JSX.Element} Admin statistics page
 */
const AdminStats = () => {
  const [vehicleStats, setVehicleStats] = useState(null);
  const [bookingStats, setBookingStats] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  /**
   * Fetch all statistics
   */
  const fetchStats = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const [vehicleResponse, bookingResponse] = await Promise.all([
        vehicleAPI.getVehicleStats(),
        bookingAPI.getBookingStats(),
      ]);

      setVehicleStats(vehicleResponse.stats);
      setBookingStats(bookingResponse.stats);
    } catch (error) {
      setError("Failed to load statistics. Please try again.");
      console.error("Fetch stats error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Load statistics on component mount
  useEffect(() => {
    fetchStats();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-slate-800 mb-2">
                System Statistics
              </h1>
              <p className="text-slate-600 text-lg">
                Comprehensive analytics and insights for your fleet management
              </p>
            </div>
            <Button
              onClick={fetchStats}
              variant="outline"
              className="flex items-center space-x-2"
              disabled={isLoading}
            >
              <RefreshCw
                className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
              />
              <span>Refresh</span>
            </Button>
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert className="mb-6 bg-red-50 border-red-200">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              {error}
            </AlertDescription>
          </Alert>
        )}

        {/* Loading State */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
              <p className="text-slate-600">Loading statistics...</p>
            </div>
          </div>
        ) : (
          <>
            {/* Vehicle Statistics */}
            {vehicleStats && (
              <div className="mb-8">
                <h2 className="text-2xl font-semibold text-slate-800 mb-6">
                  Vehicle Statistics
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium text-slate-600">
                        Total Vehicles
                      </CardTitle>
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Truck className="h-4 w-4 text-blue-600" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-slate-800">
                        {vehicleStats.total}
                      </div>
                      <p className="text-xs text-slate-500 flex items-center mt-1">
                        <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
                        Fleet size
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium text-slate-600">
                        Active Vehicles
                      </CardTitle>
                      <div className="p-2 bg-green-100 rounded-lg">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-slate-800">
                        {vehicleStats.active}
                      </div>
                      <p className="text-xs text-slate-500 flex items-center mt-1">
                        <Activity className="h-3 w-3 mr-1 text-green-500" />
                        Available for booking
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium text-slate-600">
                        Inactive Vehicles
                      </CardTitle>
                      <div className="p-2 bg-red-100 rounded-lg">
                        <AlertCircle className="h-4 w-4 text-red-600" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-slate-800">
                        {vehicleStats.inactive}
                      </div>
                      <p className="text-xs text-slate-500 flex items-center mt-1">
                        <AlertCircle className="h-3 w-3 mr-1 text-red-500" />
                        Maintenance or retired
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium text-slate-600">
                        Total Capacity
                      </CardTitle>
                      <div className="p-2 bg-purple-100 rounded-lg">
                        <BarChart3 className="h-4 w-4 text-purple-600" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-slate-800">
                        {vehicleStats.totalCapacity}
                      </div>
                      <p className="text-xs text-slate-500 flex items-center mt-1">
                        <TrendingUp className="h-3 w-3 mr-1 text-blue-500" />
                        kg total capacity
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}

            {/* Booking Statistics */}
            {bookingStats && (
              <div className="mb-8">
                <h2 className="text-2xl font-semibold text-slate-800 mb-6">
                  Booking Statistics
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium text-slate-600">
                        Total Bookings
                      </CardTitle>
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <Calendar className="h-4 w-4 text-blue-600" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-slate-800">
                        {bookingStats.total}
                      </div>
                      <p className="text-xs text-slate-500 flex items-center mt-1">
                        <TrendingUp className="h-3 w-3 mr-1 text-green-500" />
                        All time bookings
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium text-slate-600">
                        Active Bookings
                      </CardTitle>
                      <div className="p-2 bg-green-100 rounded-lg">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-slate-800">
                        {bookingStats.active}
                      </div>
                      <p className="text-xs text-slate-500 flex items-center mt-1">
                        <Clock className="h-3 w-3 mr-1 text-green-500" />
                        Currently active
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium text-slate-600">
                        Completed
                      </CardTitle>
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <CheckCircle className="h-4 w-4 text-blue-600" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-slate-800">
                        {bookingStats.completed}
                      </div>
                      <p className="text-xs text-slate-500 flex items-center mt-1">
                        <TrendingUp className="h-3 w-3 mr-1 text-blue-500" />
                        Successfully completed
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium text-slate-600">
                        Today's Bookings
                      </CardTitle>
                      <div className="p-2 bg-purple-100 rounded-lg">
                        <BarChart3 className="h-4 w-4 text-purple-600" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold text-slate-800">
                        {bookingStats.todayBookings}
                      </div>
                      <p className="text-xs text-slate-500 flex items-center mt-1">
                        <Activity className="h-3 w-3 mr-1 text-purple-500" />
                        Booked today
                      </p>
                    </CardContent>
                  </Card>
                </div>
              </div>
            )}

            {/* System Health */}
            <div className="mb-8">
              <h2 className="text-2xl font-semibold text-slate-800 mb-6">
                System Health
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card className="border-0 shadow-lg">
                  <CardHeader>
                    <CardTitle className="text-lg text-slate-800">
                      Database Status
                    </CardTitle>
                    <CardDescription className="text-slate-600">
                      MongoDB connection and performance
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-green-50 border border-green-200">
                      <span className="text-sm font-medium text-slate-800">
                        Connection
                      </span>
                      <Badge className="bg-green-100 text-green-800">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Online
                      </Badge>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-lg">
                  <CardHeader>
                    <CardTitle className="text-lg text-slate-800">
                      API Services
                    </CardTitle>
                    <CardDescription className="text-slate-600">
                      REST API endpoints status
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-green-50 border border-green-200">
                      <span className="text-sm font-medium text-slate-800">
                        Endpoints
                      </span>
                      <Badge className="bg-green-100 text-green-800">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Operational
                      </Badge>
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-lg">
                  <CardHeader>
                    <CardTitle className="text-lg text-slate-800">
                      Authentication
                    </CardTitle>
                    <CardDescription className="text-slate-600">
                      JWT token and user management
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between p-3 rounded-lg bg-green-50 border border-green-200">
                      <span className="text-sm font-medium text-slate-800">
                        Auth System
                      </span>
                      <Badge className="bg-green-100 text-green-800">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Secure
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Performance Metrics */}
            <div className="mb-8">
              <h2 className="text-2xl font-semibold text-slate-800 mb-6">
                Performance Metrics
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="border-0 shadow-lg">
                  <CardHeader>
                    <CardTitle className="text-lg text-slate-800">
                      Booking Success Rate
                    </CardTitle>
                    <CardDescription className="text-slate-600">
                      Percentage of successful bookings
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-green-600 mb-2">
                      {bookingStats
                        ? Math.round(
                            (bookingStats.completed / bookingStats.total) * 100
                          )
                        : 0}
                      %
                    </div>
                    <p className="text-sm text-slate-500">
                      {bookingStats?.completed || 0} completed out of{" "}
                      {bookingStats?.total || 0} total bookings
                    </p>
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-lg">
                  <CardHeader>
                    <CardTitle className="text-lg text-slate-800">
                      Fleet Utilization
                    </CardTitle>
                    <CardDescription className="text-slate-600">
                      Active vehicles vs total fleet
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-3xl font-bold text-blue-600 mb-2">
                      {vehicleStats
                        ? Math.round(
                            (vehicleStats.active / vehicleStats.total) * 100
                          )
                        : 0}
                      %
                    </div>
                    <p className="text-sm text-slate-500">
                      {vehicleStats?.active || 0} active out of{" "}
                      {vehicleStats?.total || 0} total vehicles
                    </p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default AdminStats;
