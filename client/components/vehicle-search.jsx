"use client";

/**
 * Vehicle Search Component for FleetLink
 * @fileoverview Beautiful vehicle search with filters and booking functionality
 */

import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { vehicleAPI, bookingAPI } from "@/lib/api";
import {
  vehicleSearchSchema,
  bookingFormSchema,
  validateFormData,
  getFieldError,
} from "@/lib/validations";
import { toast } from "sonner";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Search,
  Truck,
  Calendar,
  Weight,
  Clock,
  MapPin,
  Filter,
  Loader2,
  CheckCircle,
  AlertCircle,
} from "lucide-react";
import { SimpleDateTimePicker } from "@/components/ui/simple-time-picker";

/**
 * Vehicle search component
 * @returns {JSX.Element} Vehicle search page
 */
const VehicleSearch = () => {
  const { user } = useAuth();
  const [vehicles, setVehicles] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    capacityRequired: "",
    fromPincode: "",
    toPincode: "",
    startTime: "",
  });
  const [searchResults, setSearchResults] = useState({
    vehicles: [],
    estimatedRideDurationHours: 0,
  });
  const [validationErrors, setValidationErrors] = useState({});

  /**
   * Handle filter change
   * @param {Event} e - Input event
   */
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters((prev) => ({
      ...prev,
      [name]: value,
    }));

    // Clear validation error for this field
    if (validationErrors[name]) {
      setValidationErrors((prev) => ({
        ...prev,
        [name]: null,
      }));
    }
  };

  /**
   * Search for available vehicles
   */
  const searchVehicles = async () => {
    setIsLoading(true);
    setError(null);
    setValidationErrors({});

    try {
      // Prepare data for validation
      const searchData = {
        capacityRequired: filters.capacityRequired
          ? parseInt(filters.capacityRequired)
          : undefined,
        fromPincode: filters.fromPincode || undefined,
        toPincode: filters.toPincode || undefined,
        startTime: filters.startTime || undefined,
      };

      // Validate form data
      const validation = validateFormData(searchData, vehicleSearchSchema);
      if (!validation.success) {
        setValidationErrors(validation.errors);
        setIsLoading(false);
        return;
      }

      const searchFilters = {};
      if (validation.data.capacityRequired)
        searchFilters.capacityRequired = validation.data.capacityRequired;
      if (validation.data.fromPincode)
        searchFilters.fromPincode = validation.data.fromPincode;
      if (validation.data.toPincode)
        searchFilters.toPincode = validation.data.toPincode;
      if (validation.data.startTime)
        searchFilters.startTime = new Date(
          validation.data.startTime
        ).toISOString();

      const response = await vehicleAPI.getAvailableVehicles(searchFilters);
      // Only show truly available vehicles
      const availableVehicles = response.vehicles?.available || [];
      // Filter to ensure only vehicles with isAvailable: true are shown
      const trulyAvailableVehicles = availableVehicles.filter(
        (vehicle) => vehicle.availability?.isAvailable === true
      );
      setVehicles(trulyAvailableVehicles);
      setSearchResults({
        vehicles: trulyAvailableVehicles,
        estimatedRideDurationHours: response.estimatedRideDurationHours || 0,
      });

      // Show success message if vehicles found
      if (trulyAvailableVehicles.length > 0) {
        toast.success(
          `Found ${trulyAvailableVehicles.length} available vehicle(s)`
        );
      } else {
        toast.info("No vehicles found matching your criteria");
      }
    } catch (error) {
      console.error("Vehicle search error:", error);

      // Handle specific API errors
      if (error.response?.data?.message) {
        setError(error.response.data.message);
        toast.error(error.response.data.message);
      } else {
        const genericError = "Failed to search vehicles. Please try again.";
        setError(genericError);
        toast.error(genericError);
      }
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Handle search form submission
   * @param {Event} e - Form submit event
   */
  const handleSearch = (e) => {
    e.preventDefault();
    searchVehicles();
  };

  /**
   * Clear all filters
   */
  const clearFilters = () => {
    setFilters({
      capacityRequired: "",
      fromPincode: "",
      toPincode: "",
      startTime: "",
    });
    setVehicles([]);
    setSearchResults({ vehicles: [], estimatedRideDurationHours: 0 });
    setError(null);
  };

  /**
   * Book a vehicle
   * @param {string} vehicleId - Vehicle ID to book
   * @param {string} createdBy - Vehicle owner ID
   */
  const bookVehicle = async (vehicleId, createdBy) => {
    // Check if user is trying to book their own vehicle
    if (user && createdBy && user.id === createdBy) {
      toast.error("You cannot book your own vehicle");
      return;
    }

    // Validate required search parameters
    if (!filters.fromPincode || !filters.toPincode || !filters.startTime) {
      toast.error(
        "Please complete the search form with pincodes and start time before booking"
      );
      return;
    }

    try {
      const bookingData = {
        vehicleId,
        fromPincode: filters.fromPincode,
        toPincode: filters.toPincode,
        startTime: new Date(filters.startTime).toISOString(),
      };

      // Validate booking data
      const validation = validateFormData(bookingData, bookingFormSchema);
      if (!validation.success) {
        toast.error(
          "Invalid booking data. Please check your search parameters."
        );
        return;
      }

      const response = await bookingAPI.createBooking(validation.data);

      if (response.success) {
        toast.success("Vehicle booked successfully!");

        // Refresh the search results to update availability
        await searchVehicles();
      }
    } catch (error) {
      console.error("Booking error:", error);

      if (error.response?.status === 409) {
        toast.error(
          "Vehicle is no longer available for the selected time slot"
        );
        // Refresh search results to show updated availability
        await searchVehicles();
      } else if (error.response?.data?.message) {
        toast.error(error.response.data.message);
      } else {
        toast.error("Failed to book vehicle. Please try again.");
      }
    }
  };

  /**
   * Get vehicle status badge
   * @param {string} status - Vehicle status
   * @returns {JSX.Element} Status badge
   */
  const getStatusBadge = (status) => {
    switch (status) {
      case "available":
        return (
          <Badge className="bg-green-100 text-green-800">
            <CheckCircle className="h-3 w-3 mr-1" />
            Available
          </Badge>
        );
      case "booked":
        return (
          <Badge variant="secondary" className="bg-orange-100 text-orange-800">
            <Clock className="h-3 w-3 mr-1" />
            Booked
          </Badge>
        );
      case "maintenance":
        return (
          <Badge variant="destructive" className="bg-red-100 text-red-800">
            <AlertCircle className="h-3 w-3 mr-1" />
            Maintenance
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-slate-800 mb-2">
            Search Vehicles
          </h1>
          <p className="text-slate-600 text-lg">
            Find the perfect vehicle for your logistics needs
          </p>
        </div>

        {/* Search Filters */}
        <Card className="mb-8 border-0 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center text-xl text-slate-800">
              <Filter className="h-5 w-5 mr-2" />
              Search Filters
            </CardTitle>
            <CardDescription className="text-slate-600">
              Search for available vehicles by capacity, location, and time
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSearch} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="capacityRequired" className="text-slate-700">
                    Capacity Required (kg)
                  </Label>
                  <div className="relative">
                    <Weight className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <Input
                      id="capacityRequired"
                      name="capacityRequired"
                      type="number"
                      placeholder="e.g., 1000"
                      value={filters.capacityRequired}
                      onChange={handleFilterChange}
                      className={`pl-10 ${
                        getFieldError(validationErrors, "capacityRequired")
                          ? "border-red-500"
                          : ""
                      }`}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fromPincode" className="text-slate-700">
                    From Pincode
                  </Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <Input
                      id="fromPincode"
                      name="fromPincode"
                      type="text"
                      placeholder="e.g., 110001"
                      value={filters.fromPincode}
                      onChange={handleFilterChange}
                      className={`pl-10 ${
                        getFieldError(validationErrors, "fromPincode")
                          ? "border-red-500"
                          : ""
                      }`}
                      maxLength="6"
                    />
                  </div>
                  {getFieldError(validationErrors, "fromPincode") && (
                    <p className="text-xs text-red-600">
                      {getFieldError(validationErrors, "fromPincode")}
                    </p>
                  )}
                  <p className="text-xs text-slate-500">6-digit pincode</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="toPincode" className="text-slate-700">
                    To Pincode
                  </Label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <Input
                      id="toPincode"
                      name="toPincode"
                      type="text"
                      placeholder="e.g., 400001"
                      value={filters.toPincode}
                      onChange={handleFilterChange}
                      className={`pl-10 ${
                        getFieldError(validationErrors, "toPincode")
                          ? "border-red-500"
                          : ""
                      }`}
                      maxLength="6"
                    />
                  </div>
                  {getFieldError(validationErrors, "toPincode") && (
                    <p className="text-xs text-red-600">
                      {getFieldError(validationErrors, "toPincode")}
                    </p>
                  )}
                  <p className="text-xs text-slate-500">6-digit pincode</p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="startTime" className="text-slate-700">
                    Start Date & Time
                  </Label>
                  <SimpleDateTimePicker
                    value={
                      filters.startTime ? new Date(filters.startTime) : null
                    }
                    onChange={(date) => {
                      if (date) {
                        handleFilterChange({
                          target: {
                            name: "startTime",
                            value: date.toISOString().slice(0, 16),
                          },
                        });
                      }
                    }}
                    placeholder="Select date and time"
                    className={
                      getFieldError(validationErrors, "startTime")
                        ? "border-red-500"
                        : ""
                    }
                  />
                  {getFieldError(validationErrors, "startTime") && (
                    <p className="text-xs text-red-600">
                      {getFieldError(validationErrors, "startTime")}
                    </p>
                  )}
                  <p className="text-xs text-slate-500">
                    When do you need the vehicle?
                  </p>
                </div>
              </div>

              <div className="flex space-x-4">
                <Button
                  type="submit"
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Searching...
                    </>
                  ) : (
                    <>
                      <Search className="mr-2 h-4 w-4" />
                      Search Availability
                    </>
                  )}
                </Button>
                <Button type="button" variant="outline" onClick={clearFilters}>
                  Clear Filters
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Error Alert */}
        {error && (
          <Alert className="mb-6 bg-red-50 border-red-200">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              {error}
            </AlertDescription>
          </Alert>
        )}

        {/* Search Results */}
        {vehicles.length > 0 && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-semibold text-slate-800">
                Available Vehicles ({vehicles.length})
              </h2>
              {searchResults.estimatedRideDurationHours > 0 && (
                <div className="flex items-center space-x-2 bg-blue-50 px-4 py-2 rounded-lg">
                  <Clock className="h-4 w-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-800">
                    Estimated Ride Duration:{" "}
                    {searchResults.estimatedRideDurationHours} hours
                  </span>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Vehicle Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {vehicles
            .map((vehicle, index) => {
              // Handle both _id and id fields for backward compatibility
              const vehicleId = vehicle._id || vehicle.id || `vehicle-${index}`;
              const vehicleName = vehicle.name || "Unknown Vehicle";
              const vehicleStatus = vehicle.availability?.isAvailable
                ? "available"
                : "unavailable";
              const createdBy = vehicle.createdBy;

              // Check if this is the user's own vehicle
              const isOwnVehicle = user && createdBy && user.id === createdBy;

              // Skip rendering if essential data is missing
              if (!vehicleId || !vehicleName) {
                console.warn(
                  "Skipping vehicle with missing essential data:",
                  vehicle
                );
                return null;
              }

              // Skip rendering if vehicle is not available (double safety check)
              if (vehicleStatus !== "available") {
                console.warn("Skipping unavailable vehicle:", vehicle);
                return null;
              }

              return (
                <Card
                  key={vehicleId}
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
                            {vehicleName}
                          </CardTitle>
                          <CardDescription className="text-slate-600">
                            ID: {vehicleId ? vehicleId.slice(-8) : "N/A"}
                          </CardDescription>
                        </div>
                      </div>
                      {getStatusBadge(vehicleStatus)}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-center space-x-2">
                        <Weight className="h-4 w-4 text-slate-500" />
                        <div>
                          <p className="text-sm font-medium text-slate-800">
                            {vehicle.capacityKg || 0} kg
                          </p>
                          <p className="text-xs text-slate-500">Capacity</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Truck className="h-4 w-4 text-slate-500" />
                        <div>
                          <p className="text-sm font-medium text-slate-800">
                            {vehicle.tyres || 0}
                          </p>
                          <p className="text-xs text-slate-500">Tyres</p>
                        </div>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-slate-200">
                      {isOwnVehicle ? (
                        <div className="text-center">
                          <Badge variant="secondary" className="mb-2">
                            Your Vehicle
                          </Badge>
                          <p className="text-sm text-slate-500">
                            You cannot book your own vehicle
                          </p>
                        </div>
                      ) : (
                        <Button
                          onClick={() => bookVehicle(vehicleId, createdBy)}
                          className="w-full bg-blue-600 hover:bg-blue-700 text-white"
                          disabled={vehicleStatus !== "available"}
                        >
                          {vehicleStatus === "available"
                            ? "Book Vehicle"
                            : "Not Available"}
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })
            .filter(Boolean)}
        </div>

        {/* No Results */}
        {!isLoading && vehicles.length === 0 && !error && (
          <Card className="border-0 shadow-lg">
            <CardContent className="text-center py-12">
              <Truck className="h-16 w-16 text-slate-300 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-slate-600 mb-2">
                No Vehicles Found
              </h3>
              <p className="text-slate-500 mb-6">
                Try adjusting your search filters or check back later for new
                vehicles.
              </p>
              <Button onClick={searchVehicles} variant="outline">
                <Search className="mr-2 h-4 w-4" />
                Search Again
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default VehicleSearch;
