"use client";

/**
 * Admin Vehicle Management Component for FleetLink
 * @fileoverview Complete vehicle management interface for administrators
 */

import React, { useState, useEffect } from "react";
import { vehicleAPI } from "@/lib/api";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Truck,
  Plus,
  Edit,
  Trash2,
  Search,
  Filter,
  Loader2,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  BarChart3,
} from "lucide-react";

/**
 * Admin vehicle management component
 * @returns {JSX.Element} Admin vehicle management page
 */
const AdminVehicleManagement = () => {
  const [vehicles, setVehicles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingVehicle, setEditingVehicle] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [stats, setStats] = useState(null);

  // Form state for adding/editing vehicles
  const [formData, setFormData] = useState({
    name: "",
    capacityKg: "",
    tyres: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  /**
   * Fetch all vehicles
   */
  const fetchVehicles = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await vehicleAPI.getAllVehicles();
      setVehicles(response.vehicles || []);
    } catch (error) {
      setError("Failed to load vehicles. Please try again.");
      console.error("Fetch vehicles error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Fetch vehicle statistics
   */
  const fetchStats = async () => {
    try {
      const response = await vehicleAPI.getVehicleStats();
      setStats(response.stats);
    } catch (error) {
      console.error("Fetch stats error:", error);
    }
  };

  /**
   * Handle form input change
   * @param {Event} e - Input event
   */
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  /**
   * Handle add vehicle
   */
  const handleAddVehicle = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const vehicleData = {
        name: formData.name,
        capacityKg: parseInt(formData.capacityKg),
        tyres: parseInt(formData.tyres),
      };

      await vehicleAPI.addVehicle(vehicleData);
      await fetchVehicles();
      await fetchStats();

      setIsAddDialogOpen(false);
      setFormData({ name: "", capacityKg: "", tyres: "" });
      alert("Vehicle added successfully!");
    } catch (error) {
      console.error("Add vehicle error:", error);
      alert("Failed to add vehicle. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Handle edit vehicle
   */
  const handleEditVehicle = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const vehicleData = {
        name: formData.name,
        capacityKg: parseInt(formData.capacityKg),
        tyres: parseInt(formData.tyres),
      };

      await vehicleAPI.updateVehicle(editingVehicle._id, vehicleData);
      await fetchVehicles();
      await fetchStats();

      setIsEditDialogOpen(false);
      setEditingVehicle(null);
      setFormData({ name: "", capacityKg: "", tyres: "" });
      alert("Vehicle updated successfully!");
    } catch (error) {
      console.error("Edit vehicle error:", error);
      alert("Failed to update vehicle. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Handle delete vehicle
   * @param {string} vehicleId - Vehicle ID to delete
   */
  const handleDeleteVehicle = async (vehicleId) => {
    if (
      !confirm(
        "Are you sure you want to delete this vehicle? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      await vehicleAPI.deleteVehicle(vehicleId);
      await fetchVehicles();
      await fetchStats();
      alert("Vehicle deleted successfully!");
    } catch (error) {
      console.error("Delete vehicle error:", error);
      alert("Failed to delete vehicle. Please try again.");
    }
  };

  /**
   * Open edit dialog
   * @param {Object} vehicle - Vehicle to edit
   */
  const openEditDialog = (vehicle) => {
    setEditingVehicle(vehicle);
    setFormData({
      name: vehicle.name,
      capacityKg: vehicle.capacityKg.toString(),
      tyres: vehicle.tyres.toString(),
    });
    setIsEditDialogOpen(true);
  };

  /**
   * Get status badge
   * @param {boolean} isActive - Vehicle active status
   * @returns {JSX.Element} Status badge
   */
  const getStatusBadge = (isActive) => {
    return isActive ? (
      <Badge className="bg-green-100 text-green-800 border-green-200">
        <CheckCircle className="h-3 w-3 mr-1" />
        Active
      </Badge>
    ) : (
      <Badge
        variant="destructive"
        className="bg-red-100 text-red-800 border-red-200"
      >
        <AlertCircle className="h-3 w-3 mr-1" />
        Inactive
      </Badge>
    );
  };

  /**
   * Get filtered vehicles
   * @returns {Array} Filtered vehicles
   */
  const getFilteredVehicles = () => {
    let filtered = vehicles;

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(
        (vehicle) =>
          vehicle.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          vehicle._id.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by status
    if (statusFilter !== "all") {
      const isActive = statusFilter === "active";
      filtered = filtered.filter((vehicle) => vehicle.isActive === isActive);
    }

    return filtered;
  };

  // Load data on component mount
  useEffect(() => {
    fetchVehicles();
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
                Vehicle Management
              </h1>
              <p className="text-slate-600 text-lg">
                Manage your fleet vehicles and monitor their status
              </p>
            </div>
            <div className="flex space-x-4">
              <Button
                onClick={() => {
                  fetchVehicles();
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
              <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Vehicle
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Add New Vehicle</DialogTitle>
                    <DialogDescription>
                      Add a new vehicle to your fleet
                    </DialogDescription>
                  </DialogHeader>
                  <form onSubmit={handleAddVehicle} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Vehicle Name</Label>
                      <Input
                        id="name"
                        name="name"
                        placeholder="e.g., Truck-001"
                        value={formData.name}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="capacityKg">Capacity (kg)</Label>
                      <Input
                        id="capacityKg"
                        name="capacityKg"
                        type="number"
                        placeholder="e.g., 1000"
                        value={formData.capacityKg}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="tyres">Number of Tyres</Label>
                      <Input
                        id="tyres"
                        name="tyres"
                        type="number"
                        placeholder="e.g., 6"
                        value={formData.tyres}
                        onChange={handleInputChange}
                        required
                      />
                    </div>
                    <div className="flex justify-end space-x-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsAddDialogOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Adding...
                          </>
                        ) : (
                          "Add Vehicle"
                        )}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </div>

        {/* Statistics Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card className="border-0 shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-600">
                  Total Vehicles
                </CardTitle>
                <Truck className="h-4 w-4 text-blue-600" />
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
                  Active Vehicles
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
                  Inactive Vehicles
                </CardTitle>
                <AlertCircle className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-slate-800">
                  {stats.inactive}
                </div>
              </CardContent>
            </Card>
            <Card className="border-0 shadow-lg">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-slate-600">
                  Total Capacity
                </CardTitle>
                <BarChart3 className="h-4 w-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-slate-800">
                  {stats.totalCapacity} kg
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

        {/* Filters */}
        <Card className="mb-6 border-0 shadow-lg">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <Label htmlFor="search">Search Vehicles</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <Input
                    id="search"
                    placeholder="Search by name or ID..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <div className="md:w-48">
                <Label htmlFor="status">Status Filter</Label>
                <select
                  id="status"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="all">All Vehicles</option>
                  <option value="active">Active Only</option>
                  <option value="inactive">Inactive Only</option>
                </select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Vehicles Grid */}
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
              <p className="text-slate-600">Loading vehicles...</p>
            </div>
          </div>
        ) : (
          <>
            {getFilteredVehicles().length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {getFilteredVehicles().map((vehicle) => (
                  <Card
                    key={vehicle._id}
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
                              {vehicle.name}
                            </CardTitle>
                            <CardDescription className="text-slate-600">
                              ID: {vehicle._id.slice(-8)}
                            </CardDescription>
                          </div>
                        </div>
                        {getStatusBadge(vehicle.isActive)}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-slate-500">Capacity</p>
                          <p className="text-sm font-medium text-slate-800">
                            {vehicle.capacityKg} kg
                          </p>
                        </div>
                        <div>
                          <p className="text-xs text-slate-500">Tyres</p>
                          <p className="text-sm font-medium text-slate-800">
                            {vehicle.tyres}
                          </p>
                        </div>
                      </div>

                      <div className="pt-4 border-t border-slate-200 flex space-x-2">
                        <Button
                          onClick={() => openEditDialog(vehicle)}
                          variant="outline"
                          size="sm"
                          className="flex-1"
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </Button>
                        <Button
                          onClick={() => handleDeleteVehicle(vehicle._id)}
                          variant="destructive"
                          size="sm"
                          className="flex-1"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="border-0 shadow-lg">
                <CardContent className="text-center py-12">
                  <Truck className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-slate-600 mb-2">
                    No Vehicles Found
                  </h3>
                  <p className="text-slate-500 mb-6">
                    {searchTerm || statusFilter !== "all"
                      ? "Try adjusting your search filters."
                      : "Start by adding your first vehicle to the fleet."}
                  </p>
                  {!searchTerm && statusFilter === "all" && (
                    <Button
                      onClick={() => setIsAddDialogOpen(true)}
                      className="bg-blue-600 hover:bg-blue-700 text-white"
                    >
                      <Plus className="mr-2 h-4 w-4" />
                      Add First Vehicle
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}
          </>
        )}

        {/* Edit Vehicle Dialog */}
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Edit Vehicle</DialogTitle>
              <DialogDescription>Update vehicle information</DialogDescription>
            </DialogHeader>
            <form onSubmit={handleEditVehicle} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="edit-name">Vehicle Name</Label>
                <Input
                  id="edit-name"
                  name="name"
                  placeholder="e.g., Truck-001"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-capacityKg">Capacity (kg)</Label>
                <Input
                  id="edit-capacityKg"
                  name="capacityKg"
                  type="number"
                  placeholder="e.g., 1000"
                  value={formData.capacityKg}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-tyres">Number of Tyres</Label>
                <Input
                  id="edit-tyres"
                  name="tyres"
                  type="number"
                  placeholder="e.g., 6"
                  value={formData.tyres}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="flex justify-end space-x-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsEditDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    "Update Vehicle"
                  )}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default AdminVehicleManagement;
