"use client";

/**
 * Admin Booking Management Component for FleetLink
 * @fileoverview Complete booking management interface for administrators
 */

import React, { useState, useEffect } from "react";
import { bookingAPI } from "@/lib/api";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Calendar,
  Truck,
  User,
  MapPin,
  Clock,
  RefreshCw,
  Loader2,
  CheckCircle,
  AlertCircle,
  X,
  Filter,
  BarChart3,
} from "lucide-react";

/**
 * Admin booking management component
 * @returns {JSX.Element} Admin booking management page
 */
const AdminBookingManagement = () => {
  const [bookings, setBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("all");
  const [stats, setStats] = useState(null);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalBookings: 0,
    hasNext: false,
    hasPrev: false,
  });

  /**
   * Fetch all bookings with pagination
   * @param {string} status - Optional status filter
   * @param {number} page - Page number
   */
  const fetchBookings = async (status = null, page = 1) => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await bookingAPI.getAllBookings({
        status,
        page,
        limit: 10,
      });
      setBookings(response.bookings || []);
      setPagination(response.pagination || pagination);
    } catch (error) {
      setError("Failed to load bookings. Please try again.");
      console.error("Fetch bookings error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Fetch booking statistics
   */
  const fetchStats = async () => {
    try {
      const response = await bookingAPI.getBookingStats();
      setStats(response.stats);
    } catch (error) {
      console.error("Fetch stats error:", error);
    }
  };

  /**
   * Handle tab change
   * @param {string} value - New tab value
   */
  const handleTabChange = (value) => {
    setActiveTab(value);
    const status = value === "all" ? null : value;
    fetchBookings(status, 1);
  };

  /**
   * Handle page change
   * @param {number} page - Page number
   */
  const handlePageChange = (page) => {
    const status = activeTab === "all" ? null : activeTab;
    fetchBookings(status, page);
  };

  /**
   * Get status badge
   * @param {string} status - Booking status
   * @returns {JSX.Element} Status badge
   */
  const getStatusBadge = (status) => {
    switch (status) {
      case "active":
        return (
          <Badge className="bg-green-100 text-green-800 border-green-200">
            <CheckCircle className="h-3 w-3 mr-1" />
            Active
          </Badge>
        );
      case "completed":
        return (
          <Badge
            variant="secondary"
            className="bg-blue-100 text-blue-800 border-blue-200"
          >
            <CheckCircle className="h-3 w-3 mr-1" />
            Completed
          </Badge>
        );
      case "cancelled":
        return (
          <Badge
            variant="destructive"
            className="bg-red-100 text-red-800 border-red-200"
          >
            <X className="h-3 w-3 mr-1" />
            Cancelled
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  /**
   * Format date for display
   * @param {string} dateString - ISO date string
   * @returns {string} Formatted date
   */
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Load data on component mount
  useEffect(() => {
    fetchBookings();
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
                All Bookings
              </h1>
              <p className="text-slate-600 text-lg">
                Monitor and manage all system bookings
              </p>
            </div>
            <Button
              onClick={() => {
                fetchBookings();
                fetchStats();
              }}
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

        {/* Statistics Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card className="border-0 shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-600">
                  Total Bookings
                </CardTitle>
                <Calendar className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-slate-800">
                  {stats.total}
                </div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-600">
                  Active Bookings
                </CardTitle>
                <CheckCircle className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-slate-800">
                  {stats.active}
                </div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-600">
                  Completed
                </CardTitle>
                <CheckCircle className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-slate-800">
                  {stats.completed}
                </div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-600">
                  Today's Bookings
                </CardTitle>
                <BarChart3 className="h-4 w-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-slate-800">
                  {stats.todayBookings}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Error Alert */}
        {error && (
          <Alert className="mb-6 bg-red-50 border-red-200">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              {error}
            </AlertDescription>
          </Alert>
        )}

        {/* Booking Tabs */}
        <Tabs
          value={activeTab}
          onValueChange={handleTabChange}
          className="w-full"
        >
          <TabsList className="grid w-full grid-cols-4 bg-white shadow-sm">
            <TabsTrigger value="all" className="flex items-center space-x-2">
              <Filter className="h-4 w-4" />
              <span>All</span>
            </TabsTrigger>
            <TabsTrigger value="active" className="flex items-center space-x-2">
              <CheckCircle className="h-4 w-4" />
              <span>Active</span>
            </TabsTrigger>
            <TabsTrigger
              value="completed"
              className="flex items-center space-x-2"
            >
              <CheckCircle className="h-4 w-4" />
              <span>Completed</span>
            </TabsTrigger>
            <TabsTrigger
              value="cancelled"
              className="flex items-center space-x-2"
            >
              <X className="h-4 w-4" />
              <span>Cancelled</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-6">
            {/* Loading State */}
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
                  <p className="text-slate-600">Loading bookings...</p>
                </div>
              </div>
            ) : (
              <>
                {/* Bookings List */}
                {bookings.length > 0 ? (
                  <div className="space-y-4">
                    {bookings.map((booking) => (
                      <Card
                        key={booking._id}
                        className="border-0 shadow-lg hover:shadow-xl transition-all duration-300"
                      >
                        <CardContent className="p-6">
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center space-x-4">
                              <div className="p-2 bg-blue-100 rounded-lg">
                                <Truck className="h-5 w-5 text-blue-600" />
                              </div>
                              <div>
                                <h3 className="text-lg font-semibold text-slate-800">
                                  {booking.vehicle?.name || "Unknown Vehicle"}
                                </h3>
                                <p className="text-sm text-slate-600">
                                  Booking #{booking._id.slice(-8)}
                                </p>
                              </div>
                            </div>
                            {getStatusBadge(booking.status)}
                          </div>

                          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            {/* User Information */}
                            <div className="flex items-center space-x-3">
                              <User className="h-4 w-4 text-slate-500" />
                              <div>
                                <p className="text-sm font-medium text-slate-800">
                                  {booking.user?.name || "Unknown User"}
                                </p>
                                <p className="text-xs text-slate-500">
                                  {booking.user?.email || "No email"}
                                </p>
                              </div>
                            </div>

                            {/* Route Information */}
                            <div className="flex items-center space-x-3">
                              <MapPin className="h-4 w-4 text-slate-500" />
                              <div>
                                <p className="text-sm font-medium text-slate-800">
                                  {booking.pincodes.start} →{" "}
                                  {booking.pincodes.end}
                                </p>
                                <p className="text-xs text-slate-500">Route</p>
                              </div>
                            </div>

                            {/* Time Information */}
                            <div className="flex items-center space-x-3">
                              <Clock className="h-4 w-4 text-slate-500" />
                              <div>
                                <p className="text-sm font-medium text-slate-800">
                                  {formatDate(booking.times.start)}
                                </p>
                                <p className="text-xs text-slate-500">
                                  Duration:{" "}
                                  {Math.round(
                                    (new Date(booking.times.end) -
                                      new Date(booking.times.start)) /
                                      (1000 * 60 * 60)
                                  )}{" "}
                                  hours
                                </p>
                              </div>
                            </div>
                          </div>

                          {/* Vehicle Details */}
                          <div className="mt-4 pt-4 border-t border-slate-200">
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                              <div>
                                <p className="text-xs text-slate-500">
                                  Vehicle ID
                                </p>
                                <p className="text-sm font-medium text-slate-800">
                                  {booking.vehicle?._id?.slice(-8) || "N/A"}
                                </p>
                              </div>
                              <div>
                                <p className="text-xs text-slate-500">
                                  Capacity
                                </p>
                                <p className="text-sm font-medium text-slate-800">
                                  {booking.vehicle?.capacityKg || "N/A"} kg
                                </p>
                              </div>
                              <div>
                                <p className="text-xs text-slate-500">Tyres</p>
                                <p className="text-sm font-medium text-slate-800">
                                  {booking.vehicle?.tyres || "N/A"}
                                </p>
                              </div>
                              <div>
                                <p className="text-xs text-slate-500">
                                  Created
                                </p>
                                <p className="text-sm font-medium text-slate-800">
                                  {formatDate(booking.createdAt)}
                                </p>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  /* No Bookings State */
                  <Card className="border-0 shadow-lg">
                    <CardContent className="text-center py-12">
                      <Calendar className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                      <h3 className="text-xl font-semibold text-slate-600 mb-2">
                        {activeTab === "all"
                          ? "No Bookings Yet"
                          : `No ${activeTab} bookings`}
                      </h3>
                      <p className="text-slate-500">
                        {activeTab === "all"
                          ? "No bookings have been made in the system yet."
                          : `There are no ${activeTab} bookings at the moment.`}
                      </p>
                    </CardContent>
                  </Card>
                )}

                {/* Pagination */}
                {pagination.totalPages > 1 && (
                  <div className="flex items-center justify-center space-x-2 mt-8">
                    <Button
                      variant="outline"
                      onClick={() =>
                        handlePageChange(pagination.currentPage - 1)
                      }
                      disabled={!pagination.hasPrev}
                    >
                      Previous
                    </Button>
                    <span className="text-sm text-slate-600">
                      Page {pagination.currentPage} of {pagination.totalPages}
                    </span>
                    <Button
                      variant="outline"
                      onClick={() =>
                        handlePageChange(pagination.currentPage + 1)
                      }
                      disabled={!pagination.hasNext}
                    >
                      Next
                    </Button>
                  </div>
                )}
              </>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminBookingManagement;
