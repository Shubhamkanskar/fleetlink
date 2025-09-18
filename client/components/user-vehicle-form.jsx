"use client";

/**
 * User Vehicle Form Component for FleetLink
 * @fileoverview Simple form for users to add vehicles to the fleet
 */

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { vehicleAPI } from "@/lib/api";
import {
  vehicleFormSchema,
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
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Truck,
  Plus,
  Loader2,
  CheckCircle,
  AlertCircle,
  ArrowLeft,
} from "lucide-react";

/**
 * User vehicle form component
 * @returns {JSX.Element} User vehicle addition form
 */
const UserVehicleForm = () => {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "",
    capacityKg: "",
    tyres: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [validationErrors, setValidationErrors] = useState({});

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

    // Clear validation error for this field
    if (validationErrors[name]) {
      setValidationErrors((prev) => ({
        ...prev,
        [name]: null,
      }));
    }
  };

  /**
   * Handle form submission
   * @param {Event} e - Form event
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccess(false);
    setValidationErrors({});

    try {
      // Prepare data for validation
      const vehicleData = {
        name: formData.name,
        capacityKg: parseInt(formData.capacityKg),
        tyres: parseInt(formData.tyres),
      };

      // Validate form data
      const validation = validateFormData(vehicleData, vehicleFormSchema);
      if (!validation.success) {
        setValidationErrors(validation.errors);
        setIsSubmitting(false);
        return;
      }

      const response = await vehicleAPI.addVehicle(validation.data);

      setSuccess(true);
      setFormData({ name: "", capacityKg: "", tyres: "" });

      // Show success toast
      toast.success("Vehicle added successfully!");

      // Redirect to dashboard after 2 seconds
      setTimeout(() => {
        router.push("/dashboard");
      }, 2000);
    } catch (error) {
      console.error("Add vehicle error:", error);
      const errorMessage =
        error.response?.data?.message ||
        "Failed to add vehicle. Please try again.";
      setError(errorMessage);

      // Show error toast
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center space-x-4 mb-4">
            <Button
              variant="outline"
              onClick={() => router.back()}
              className="flex items-center space-x-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back</span>
            </Button>
          </div>
          <div>
            <h1 className="text-4xl font-bold text-slate-800 mb-2">
              Add Vehicle to Fleet
            </h1>
            <p className="text-slate-600 text-lg">
              Contribute to the fleet by adding your vehicle
            </p>
          </div>
        </div>

        {/* Success Alert */}
        {success && (
          <Alert className="mb-6 bg-green-50 border-green-200">
            <CheckCircle className="h-4 w-4 text-green-600" />
            <AlertDescription className="text-green-800">
              Vehicle added successfully! Redirecting to dashboard...
            </AlertDescription>
          </Alert>
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

        {/* Vehicle Form */}
        <Card className="border-0 shadow-lg">
          <CardHeader>
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Truck className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-2xl text-slate-800">
                  Vehicle Information
                </CardTitle>
                <CardDescription className="text-slate-600">
                  Provide details about your vehicle to add it to the fleet
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label
                  htmlFor="name"
                  className="text-sm font-medium text-slate-700"
                >
                  Vehicle Name *
                </Label>
                <Input
                  id="name"
                  name="name"
                  placeholder="e.g., My Delivery Truck, Company Van-001"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className={`w-full ${
                    getFieldError(validationErrors, "name")
                      ? "border-red-500"
                      : ""
                  }`}
                />
                {getFieldError(validationErrors, "name") && (
                  <p className="text-xs text-red-600">
                    {getFieldError(validationErrors, "name")}
                  </p>
                )}
                <p className="text-xs text-slate-500">
                  Give your vehicle a descriptive name
                </p>
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="capacityKg"
                  className="text-sm font-medium text-slate-700"
                >
                  Capacity (kg) *
                </Label>
                <Input
                  id="capacityKg"
                  name="capacityKg"
                  type="number"
                  placeholder="e.g., 1000"
                  value={formData.capacityKg}
                  onChange={handleInputChange}
                  required
                  min="1"
                  className={`w-full ${
                    getFieldError(validationErrors, "capacityKg")
                      ? "border-red-500"
                      : ""
                  }`}
                />
                {getFieldError(validationErrors, "capacityKg") && (
                  <p className="text-xs text-red-600">
                    {getFieldError(validationErrors, "capacityKg")}
                  </p>
                )}
                <p className="text-xs text-slate-500">
                  Maximum weight your vehicle can carry in kilograms
                </p>
              </div>

              <div className="space-y-2">
                <Label
                  htmlFor="tyres"
                  className="text-sm font-medium text-slate-700"
                >
                  Number of Tyres *
                </Label>
                <Input
                  id="tyres"
                  name="tyres"
                  type="number"
                  placeholder="e.g., 4, 6, 8"
                  value={formData.tyres}
                  onChange={handleInputChange}
                  required
                  min="2"
                  max="20"
                  className={`w-full ${
                    getFieldError(validationErrors, "tyres")
                      ? "border-red-500"
                      : ""
                  }`}
                />
                {getFieldError(validationErrors, "tyres") && (
                  <p className="text-xs text-red-600">
                    {getFieldError(validationErrors, "tyres")}
                  </p>
                )}
                <p className="text-xs text-slate-500">
                  Total number of tyres on your vehicle
                </p>
              </div>

              <div className="pt-4 border-t border-slate-200">
                <div className="flex flex-col sm:flex-row gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.back()}
                    className="flex-1"
                    disabled={isSubmitting}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Adding Vehicle...
                      </>
                    ) : (
                      <>
                        <Plus className="mr-2 h-4 w-4" />
                        Add Vehicle to Fleet
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Information Card */}
        <Card className="mt-6 border-0 shadow-lg bg-blue-50">
          <CardContent className="p-6">
            <div className="flex items-start space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Truck className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-800 mb-2">
                  About Adding Vehicles
                </h3>
                <ul className="text-sm text-slate-600 space-y-1">
                  <li>
                    • Your vehicle will be available for booking by other users
                  </li>
                  <li>• You can manage your vehicles from your dashboard</li>
                  <li>• Vehicle information can be updated later if needed</li>
                  <li>
                    • All vehicles are subject to fleet management policies
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default UserVehicleForm;
