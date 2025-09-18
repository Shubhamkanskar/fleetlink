"use client";

/**
 * Booking Management Component for FleetLink
 * @fileoverview Beautiful booking management interface with status filtering and cancellation
 */

import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
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
  MapPin,
  Clock,
  X,
  CheckCircle,
  AlertCircle,
  Loader2,
  RefreshCw,
  Filter,
} from "lucide-react";

/**
 * Booking management component
 * @returns {JSX.Element} Booking management page
 */
const BookingManagement = () => {
  const { user } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("all");
  const [cancellingId, setCancellingId] = useState(null);

  /**
   * Fetch user's bookings
   * @param {string} status - Optional status filter
   */
  const fetchBookings = async (status = null) => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await bookingAPI.getUserBookings(status);
      setBookings(response.bookings || []);
    } catch (error) {
      setError("Failed to load bookings. Please try again.");
      console.error("Fetch bookings error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Cancel a booking
   * @param {string} bookingId - Booking ID to cancel
   */
  const cancelBooking = async (bookingId) => {
    try {
      setCancellingId(bookingId);
      await bookingAPI.cancelBooking(bookingId);

      // Refresh bookings after cancellation
      await fetchBookings();

      // Show success message (you could add a toast here)
      alert("Booking cancelled successfully!");
    } catch (error) {
      console.error("Cancel booking error:", error);
      alert("Failed to cancel booking. Please try again.");
    } finally {
      setCancellingId(null);
    }
  };

  /**
   * Complete a booking
   * @param {string} bookingId - Booking ID to complete
   */
  const completeBooking = async (bookingId) => {
    try {
      setCancellingId(bookingId);
      await bookingAPI.completeBooking(bookingId);

      // Refresh bookings after completion
      await fetchBookings();

      // Show success message
      alert("Booking completed successfully!");
    } catch (error) {
      console.error("Complete booking error:", error);
      alert("Failed to complete booking. Please try again.");
    } finally {
      setCancellingId(null);
    }
  };

  /**
   * Handle tab change
   * @param {string} value - New tab value
   */
  const handleTabChange = (value) => {
    setActiveTab(value);
    const status = value === "all" ? null : value;
    fetchBookings(status);
  };

  /**
   * Get status badge component
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

  /**
   * Check if booking can be cancelled
   * @param {Object} booking - Booking object
   * @returns {boolean} True if booking can be cancelled
   */
  const canCancelBooking = (booking) => {
    if (booking.status !== "active") return false;
    const startTime = new Date(booking.times.start);
    const now = new Date();
    return startTime > now;
  };

  /**
   * Check if booking can be completed
   * @param {Object} booking - Booking object
   * @returns {boolean} True if booking can be completed
   */
  const canCompleteBooking = (booking) => {
    if (booking.status !== "active") return false;
    const startTime = new Date(booking.times.start);
    const now = new Date();
    return startTime <= now; // Can complete if booking has started
  };

  /**
   * Get filtered bookings based on active tab
   * @returns {Array} Filtered bookings
   */
  const getFilteredBookings = () => {
    if (activeTab === "all") return bookings;
    return bookings.filter((booking) => booking.status === activeTab);
  };

  // Load bookings on component mount
  useEffect(() => {
    fetchBookings();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold text-slate-800 mb-2">
                My Bookings
              </h1>
              <p className="text-slate-600 text-lg">
                Manage your vehicle bookings and track their status
              </p>
            </div>
            <Button
              onClick={() => fetchBookings()}
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
                  <p className="text-slate-600">Loading your bookings...</p>
                </div>
              </div>
            ) : (
              <>
                {/* Bookings Grid */}
                {getFilteredBookings().length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {getFilteredBookings().map((booking) => (
                      <Card
                        key={booking._id}
                        className="group hover:shadow-xl transition-all duration-300 border-0 shadow-lg"
                      >
                        <CardHeader className="pb-3">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div className="p-2 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
                                <Truck className="h-5 w-5 text-blue-600" />
                              </div>
                              <div>
                                <CardTitle className="text-lg text-slate-800">
                                  {booking.vehicle?.name || "Unknown Vehicle"}
                                </CardTitle>
                                <CardDescription className="text-slate-600">
                                  Booking #{booking._id.slice(-8)}
                                </CardDescription>
                              </div>
                            </div>
                            {getStatusBadge(booking.status)}
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          {/* Route Information */}
                          <div className="flex items-center space-x-2 p-3 rounded-lg bg-slate-50">
                            <MapPin className="h-4 w-4 text-slate-500" />
                            <div className="flex-1">
                              <p className="text-sm font-medium text-slate-800">
                                {booking.pincodes.start} →{" "}
                                {booking.pincodes.end}
                              </p>
                              <p className="text-xs text-slate-500">Route</p>
                            </div>
                          </div>

                          {/* Time Information */}
                          <div className="flex items-center space-x-2 p-3 rounded-lg bg-slate-50">
                            <Clock className="h-4 w-4 text-slate-500" />
                            <div className="flex-1">
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

                          {/* Vehicle Details */}
                          <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-200">
                            <div>
                              <p className="text-xs text-slate-500">Capacity</p>
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
                          </div>

                          {/* Action Buttons */}
                          {(canCancelBooking(booking) ||
                            canCompleteBooking(booking)) && (
                            <div className="pt-4 border-t border-slate-200 space-y-2">
                              {canCancelBooking(booking) && (
                                <Button
                                  onClick={() => cancelBooking(booking._id)}
                                  variant="destructive"
                                  size="sm"
                                  className="w-full"
                                  disabled={cancellingId === booking._id}
                                >
                                  {cancellingId === booking._id ? (
                                    <>
                                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                      Cancelling...
                                    </>
                                  ) : (
                                    <>
                                      <X className="mr-2 h-4 w-4" />
                                      Cancel Booking
                                    </>
                                  )}
                                </Button>
                              )}
                              {canCompleteBooking(booking) && (
                                <Button
                                  onClick={() => completeBooking(booking._id)}
                                  variant="default"
                                  size="sm"
                                  className="w-full bg-green-600 hover:bg-green-700"
                                  disabled={cancellingId === booking._id}
                                >
                                  {cancellingId === booking._id ? (
                                    <>
                                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                      Completing...
                                    </>
                                  ) : (
                                    <>
                                      <CheckCircle className="mr-2 h-4 w-4" />
                                      Complete Booking
                                    </>
                                  )}
                                </Button>
                              )}
                            </div>
                          )}
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
                      <p className="text-slate-500 mb-6">
                        {activeTab === "all"
                          ? "Start by searching for vehicles and making your first booking."
                          : `You don't have any ${activeTab} bookings at the moment.`}
                      </p>
                      {activeTab === "all" && (
                        <Button
                          asChild
                          className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          <a href="/search">Search Vehicles</a>
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                )}
              </>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default BookingManagement;
