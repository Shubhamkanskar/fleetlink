"use client";

/**
 * Settings Component for FleetLink
 * @fileoverview User settings page with vehicle management and account settings
 */

import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { authAPI, vehicleAPI, bookingAPI } from "@/lib/api";
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
  Settings as SettingsIcon,
  User,
  Truck,
  Trash2,
  Edit,
  Save,
  X,
  AlertTriangle,
  CheckCircle,
  Loader2,
  ArrowLeft,
  Eye,
  EyeOff,
} from "lucide-react";
import Link from "next/link";
import { toast } from "sonner";

/**
 * Settings component
 * @returns {JSX.Element} Settings page
 */
const Settings = () => {
  const { user, isAdmin } = useAuth();
  const [activeTab, setActiveTab] = useState("account");
  const [userVehicles, setUserVehicles] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(null);

  // Account settings state
  const [accountForm, setAccountForm] = useState({
    name: user?.name || "",
    email: user?.email || "",
  });
  const [isEditingAccount, setIsEditingAccount] = useState(false);
  const [isSavingAccount, setIsSavingAccount] = useState(false);

  // Password change state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  /**
   * Fetch user's vehicles
   */
  const fetchUserVehicles = async () => {
    try {
      setIsLoading(true);
      const response = await vehicleAPI.getUserVehicles();
      setUserVehicles(response.vehicles || []);
    } catch (error) {
      console.error("Error fetching user vehicles:", error);
      toast.error("Failed to load your vehicles");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUserVehicles();
  }, []);

  /**
   * Handle account form changes
   */
  const handleAccountChange = (e) => {
    const { name, value } = e.target;
    setAccountForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  /**
   * Handle password form changes
   */
  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordForm((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  /**
   * Save account changes
   */
  const handleSaveAccount = async () => {
    try {
      setIsSavingAccount(true);
      await authAPI.updateProfile({
        name: accountForm.name,
      });
      toast.success("Profile updated successfully");
      setIsEditingAccount(false);
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile");
    } finally {
      setIsSavingAccount(false);
    }
  };

  /**
   * Change password
   */
  const handleChangePassword = async () => {
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }

    if (passwordForm.newPassword.length < 6) {
      toast.error("New password must be at least 6 characters");
      return;
    }

    try {
      setIsChangingPassword(true);
      await authAPI.changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      toast.success("Password changed successfully");
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (error) {
      console.error("Error changing password:", error);
      toast.error(error.response?.data?.message || "Failed to change password");
    } finally {
      setIsChangingPassword(false);
    }
  };

  /**
   * Delete vehicle
   */
  const handleDeleteVehicle = async (vehicleId) => {
    try {
      setIsDeleting(vehicleId);

      // Check if vehicle has active bookings
      const bookingsResponse = await bookingAPI.getUserBookings();
      const activeBookings = bookingsResponse.bookings?.filter(
        (booking) =>
          booking.vehicleId === vehicleId && booking.status === "active"
      );

      if (activeBookings && activeBookings.length > 0) {
        toast.error("Cannot delete vehicle with active bookings");
        return;
      }

      // Delete the vehicle
      await vehicleAPI.deleteUserVehicle(vehicleId);
      toast.success("Vehicle deleted successfully");

      // Refresh the list
      fetchUserVehicles();
    } catch (error) {
      console.error("Error deleting vehicle:", error);
      toast.error(error.response?.data?.message || "Failed to delete vehicle");
    } finally {
      setIsDeleting(null);
    }
  };

  /**
   * Toggle password visibility
   */
  const togglePasswordVisibility = (field) => {
    setShowPasswords((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
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
              <Link href="/profile">
                <ArrowLeft className="h-4 w-4" />
                <span>Back to Profile</span>
              </Link>
            </Button>
          </div>
          <div>
            <h1 className="text-4xl font-bold text-slate-800 mb-2">Settings</h1>
            <p className="text-slate-600 text-lg">
              Manage your account and vehicle settings
            </p>
          </div>
        </div>

        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-6"
        >
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="account">Account Settings</TabsTrigger>
            <TabsTrigger value="vehicles">My Vehicles</TabsTrigger>
          </TabsList>

          {/* Account Settings Tab */}
          <TabsContent value="account" className="space-y-6">
            {/* Profile Information */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center text-xl text-slate-800">
                  <User className="h-5 w-5 mr-2" />
                  Profile Information
                </CardTitle>
                <CardDescription className="text-slate-600">
                  Update your personal information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      name="name"
                      value={accountForm.name}
                      onChange={handleAccountChange}
                      disabled={!isEditingAccount}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      name="email"
                      value={accountForm.email}
                      disabled
                      className="bg-slate-50"
                    />
                    <p className="text-xs text-slate-500">
                      Email cannot be changed
                    </p>
                  </div>
                </div>
                <div className="flex space-x-2">
                  {isEditingAccount ? (
                    <>
                      <Button
                        onClick={handleSaveAccount}
                        disabled={isSavingAccount}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        {isSavingAccount ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Saving...
                          </>
                        ) : (
                          <>
                            <Save className="mr-2 h-4 w-4" />
                            Save Changes
                          </>
                        )}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setIsEditingAccount(false);
                          setAccountForm({
                            name: user?.name || "",
                            email: user?.email || "",
                          });
                        }}
                      >
                        <X className="mr-2 h-4 w-4" />
                        Cancel
                      </Button>
                    </>
                  ) : (
                    <Button
                      variant="outline"
                      onClick={() => setIsEditingAccount(true)}
                    >
                      <Edit className="mr-2 h-4 w-4" />
                      Edit Profile
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Password Change */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center text-xl text-slate-800">
                  <SettingsIcon className="h-5 w-5 mr-2" />
                  Change Password
                </CardTitle>
                <CardDescription className="text-slate-600">
                  Update your account password
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Current Password</Label>
                  <div className="relative">
                    <Input
                      id="currentPassword"
                      name="currentPassword"
                      type={showPasswords.current ? "text" : "password"}
                      value={passwordForm.currentPassword}
                      onChange={handlePasswordChange}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => togglePasswordVisibility("current")}
                    >
                      {showPasswords.current ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newPassword">New Password</Label>
                  <div className="relative">
                    <Input
                      id="newPassword"
                      name="newPassword"
                      type={showPasswords.new ? "text" : "password"}
                      value={passwordForm.newPassword}
                      onChange={handlePasswordChange}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => togglePasswordVisibility("new")}
                    >
                      {showPasswords.new ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirm New Password</Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showPasswords.confirm ? "text" : "password"}
                      value={passwordForm.confirmPassword}
                      onChange={handlePasswordChange}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => togglePasswordVisibility("confirm")}
                    >
                      {showPasswords.confirm ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
                <Button
                  onClick={handleChangePassword}
                  disabled={
                    isChangingPassword ||
                    !passwordForm.currentPassword ||
                    !passwordForm.newPassword ||
                    !passwordForm.confirmPassword
                  }
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {isChangingPassword ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Changing Password...
                    </>
                  ) : (
                    <>
                      <Save className="mr-2 h-4 w-4" />
                      Change Password
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* My Vehicles Tab */}
          <TabsContent value="vehicles" className="space-y-6">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center text-xl text-slate-800">
                      <Truck className="h-5 w-5 mr-2" />
                      My Vehicles
                    </CardTitle>
                    <CardDescription className="text-slate-600">
                      Manage your contributed vehicles
                    </CardDescription>
                  </div>
                  <Button asChild>
                    <Link href="/add-vehicle">
                      <Truck className="mr-2 h-4 w-4" />
                      Add Vehicle
                    </Link>
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="text-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-blue-600" />
                    <p className="text-slate-500">Loading your vehicles...</p>
                  </div>
                ) : userVehicles.length === 0 ? (
                  <div className="text-center py-8">
                    <Truck className="h-16 w-16 text-slate-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-slate-600 mb-2">
                      No Vehicles Added
                    </h3>
                    <p className="text-slate-500 mb-4">
                      You haven't added any vehicles to the fleet yet.
                    </p>
                    <Button asChild>
                      <Link href="/add-vehicle">
                        <Truck className="mr-2 h-4 w-4" />
                        Add Your First Vehicle
                      </Link>
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {userVehicles.map((vehicle) => (
                      <div
                        key={vehicle.id}
                        className="flex items-center justify-between p-4 border border-slate-200 rounded-lg"
                      >
                        <div className="flex items-center space-x-4">
                          <div className="p-2 bg-blue-100 rounded-lg">
                            <Truck className="h-5 w-5 text-blue-600" />
                          </div>
                          <div>
                            <h4 className="font-semibold text-slate-800">
                              {vehicle.name}
                            </h4>
                            <p className="text-sm text-slate-600">
                              {vehicle.capacityKg} kg • {vehicle.tyres} tyres
                            </p>
                            <Badge
                              variant={
                                vehicle.isActive ? "default" : "secondary"
                              }
                              className="mt-1"
                            >
                              {vehicle.isActive ? "Active" : "Inactive"}
                            </Badge>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </DialogTrigger>
                            <DialogContent>
                              <DialogHeader>
                                <DialogTitle className="flex items-center">
                                  <AlertTriangle className="h-5 w-5 mr-2 text-red-600" />
                                  Delete Vehicle
                                </DialogTitle>
                                <DialogDescription>
                                  Are you sure you want to delete "
                                  {vehicle.name}"? This action cannot be undone.
                                  The vehicle will be removed from the fleet and
                                  will no longer be available for booking.
                                </DialogDescription>
                              </DialogHeader>
                              <div className="flex justify-end space-x-2">
                                <Button variant="outline">Cancel</Button>
                                <Button
                                  variant="destructive"
                                  onClick={() =>
                                    handleDeleteVehicle(vehicle.id)
                                  }
                                  disabled={isDeleting === vehicle.id}
                                >
                                  {isDeleting === vehicle.id ? (
                                    <>
                                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                      Deleting...
                                    </>
                                  ) : (
                                    <>
                                      <Trash2 className="mr-2 h-4 w-4" />
                                      Delete Vehicle
                                    </>
                                  )}
                                </Button>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Settings;
