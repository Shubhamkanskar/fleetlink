"use client";

/**
 * Notifications Component for FleetLink
 * @fileoverview Displays user notifications with read/unread status
 */

import React, { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { notificationAPI } from "@/lib/api";
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
import {
  Bell,
  BellRing,
  Calendar,
  Truck,
  MapPin,
  Clock,
  User,
  Mail,
  Loader2,
  RefreshCw,
  Check,
} from "lucide-react";
import { toast } from "sonner";

/**
 * Notification component
 * @returns {JSX.Element} Notifications page
 */
const Notifications = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [unreadCount, setUnreadCount] = useState(0);
  const [markingAsRead, setMarkingAsRead] = useState(false);

  /**
   * Fetch user notifications
   */
  const fetchNotifications = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const [notificationsResponse, unreadResponse] = await Promise.all([
        notificationAPI.getNotifications({ limit: 50 }),
        notificationAPI.getUnreadCount(),
      ]);

      setNotifications(notificationsResponse.notifications || []);
      setUnreadCount(unreadResponse.unreadCount || 0);
    } catch (error) {
      console.error("Fetch notifications error:", error);
      setError("Failed to load notifications. Please try again.");
      toast.error("Failed to load notifications");
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Mark notifications as read
   * @param {Array} notificationIds - Array of notification IDs to mark as read
   */
  const markAsRead = async (notificationIds) => {
    try {
      setMarkingAsRead(true);
      await notificationAPI.markAsRead(notificationIds);

      // Update local state
      setNotifications((prev) =>
        prev.map((notification) =>
          notificationIds.includes(notification._id)
            ? { ...notification, isRead: true }
            : notification
        )
      );

      // Update unread count
      setUnreadCount((prev) => Math.max(0, prev - notificationIds.length));

      toast.success("Notifications marked as read");
    } catch (error) {
      console.error("Mark as read error:", error);
      toast.error("Failed to mark notifications as read");
    } finally {
      setMarkingAsRead(false);
    }
  };

  /**
   * Mark all notifications as read
   */
  const markAllAsRead = async () => {
    const unreadNotifications = notifications.filter((n) => !n.isRead);
    if (unreadNotifications.length === 0) return;

    const unreadIds = unreadNotifications.map((n) => n._id);
    await markAsRead(unreadIds);
  };

  /**
   * Get notification icon based on type
   * @param {string} type - Notification type
   * @returns {JSX.Element} Icon component
   */
  const getNotificationIcon = (type) => {
    switch (type) {
      case "booking_created":
        return <Truck className="h-5 w-5 text-blue-600" />;
      case "booking_cancelled":
        return <Calendar className="h-5 w-5 text-orange-600" />;
      case "booking_completed":
        return <Check className="h-5 w-5 text-green-600" />;
      default:
        return <Bell className="h-5 w-5 text-gray-600" />;
    }
  };

  /**
   * Format notification message
   * @param {Object} notification - Notification object
   * @returns {JSX.Element} Formatted message
   */
  const formatNotificationMessage = (notification) => {
    if (notification.type === "booking_created" && notification.data) {
      const {
        vehicleName,
        customerName,
        fromPincode,
        toPincode,
        startTime,
        endTime,
      } = notification.data;
      return (
        <div className="space-y-2">
          <p className="text-sm text-gray-700">
            Your vehicle <strong>"{vehicleName}"</strong> has been booked by{" "}
            <strong>{customerName}</strong>
          </p>
          <div className="flex flex-wrap gap-4 text-xs text-gray-500">
            <div className="flex items-center gap-1">
              <MapPin className="h-3 w-3" />
              <span>
                {fromPincode} → {toPincode}
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              <span>
                {new Date(startTime).toLocaleString()} -{" "}
                {new Date(endTime).toLocaleString()}
              </span>
            </div>
          </div>
        </div>
      );
    }
    return <p className="text-sm text-gray-700">{notification.message}</p>;
  };

  useEffect(() => {
    if (user) {
      fetchNotifications();
    }
  }, [user]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-600">Loading notifications...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">
            Notifications
          </h2>
          <p className="text-gray-600">
            {unreadCount > 0
              ? `${unreadCount} unread notifications`
              : "All caught up!"}
          </p>
        </div>
        <div className="flex gap-2">
          {unreadCount > 0 && (
            <Button
              onClick={markAllAsRead}
              disabled={markingAsRead}
              variant="outline"
              size="sm"
            >
              {markingAsRead ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Check className="h-4 w-4 mr-2" />
              )}
              Mark All Read
            </Button>
          )}
          <Button
            onClick={fetchNotifications}
            disabled={isLoading}
            variant="outline"
            size="sm"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Error State */}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {/* Notifications List */}
      {notifications.length === 0 ? (
        <Card>
          <CardContent className="text-center py-12">
            <Bell className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">
              No Notifications
            </h3>
            <p className="text-gray-500">
              You'll receive notifications when someone books your vehicles or
              when there are updates to your bookings.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {notifications.map((notification) => (
            <Card
              key={notification._id}
              className={`transition-all duration-200 hover:shadow-md ${
                !notification.isRead
                  ? "border-l-4 border-l-blue-500 bg-blue-50"
                  : ""
              }`}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3">
                    <div className="mt-1">
                      {getNotificationIcon(notification.type)}
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-lg text-gray-900">
                        {notification.title}
                      </CardTitle>
                      <CardDescription className="text-sm text-gray-600">
                        {new Date(notification.createdAt).toLocaleString()}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {!notification.isRead && (
                      <Badge
                        variant="secondary"
                        className="bg-blue-100 text-blue-800"
                      >
                        New
                      </Badge>
                    )}
                    {!notification.isRead && (
                      <Button
                        onClick={() => markAsRead([notification._id])}
                        disabled={markingAsRead}
                        variant="ghost"
                        size="sm"
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {formatNotificationMessage(notification)}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default Notifications;
