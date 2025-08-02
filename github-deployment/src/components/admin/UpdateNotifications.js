import React, { useState, useEffect } from 'react';
import { MessageSquare, CheckCircle, ExternalLink, User, Building, AlertCircle, Clock } from 'lucide-react';
import { adminAPI } from '../../services/api';
import { Link } from 'react-router-dom';

const UpdateNotifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);

  useEffect(() => {
    loadNotifications();
  }, []);

  const loadNotifications = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getUpdateNotifications();
      setNotifications(response);
    } catch (error) {
      console.error('Failed to load update notifications:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleProcess = async (notificationId) => {
    try {
      setProcessingId(notificationId);
      await adminAPI.processUpdateNotification(notificationId);
      // Remove the processed notification from the list
      setNotifications(notifications.filter(n => n.id !== notificationId));
    } catch (error) {
      console.error('Failed to process notification:', error);
      alert('Failed to mark notification as processed');
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">VASP Update Notifications</h1>
        <p className="mt-1 text-sm text-gray-600">
          Review user-submitted updates about VASPs that may require record changes
        </p>
      </div>

      {notifications.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <MessageSquare className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No pending notifications</h3>
          <p className="mt-1 text-sm text-gray-500">
            Update notifications will appear here when users flag important changes
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {notifications.map((notification) => (
            <div key={notification.id} className="bg-white rounded-lg shadow overflow-hidden">
              <div className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    {/* VASP Info */}
                    <div className="flex items-center mb-3">
                      <Building className="h-5 w-5 text-gray-400 mr-2" />
                      <h3 className="text-lg font-medium text-gray-900">
                        {notification.vasp.name}
                      </h3>
                      <span className="ml-2 text-sm text-gray-500">
                        ({notification.vasp.jurisdiction})
                      </span>
                    </div>

                    {/* Update Content */}
                    <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4 mb-4">
                      <div className="flex">
                        <AlertCircle className="h-5 w-5 text-yellow-400 flex-shrink-0" />
                        <div className="ml-3">
                          <h4 className="text-sm font-medium text-yellow-800">Update Notification</h4>
                          <p className="mt-1 text-sm text-yellow-700">
                            {notification.content}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Submitter Info */}
                    <div className="flex items-center text-sm text-gray-500 mb-3">
                      <User className="h-4 w-4 mr-1" />
                      <span>
                        {notification.user.firstName} {notification.user.lastName} 
                        ({notification.user.agencyName})
                      </span>
                      <Clock className="h-4 w-4 ml-4 mr-1" />
                      <span>
                        {new Date(notification.createdAt).toLocaleString()}
                      </span>
                    </div>

                    {/* VASP Details */}
                    <div className="grid grid-cols-2 gap-4 text-sm bg-gray-50 rounded p-3">
                      <div>
                        <span className="font-medium text-gray-700">Current Email:</span>
                        <span className="ml-2 text-gray-600">{notification.vasp.email}</span>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Legal Name:</span>
                        <span className="ml-2 text-gray-600">{notification.vasp.legalName}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="ml-6 flex flex-col gap-2">
                    <Link
                      to={`/admin/vasps?id=${notification.vasp.id}`}
                      className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      <ExternalLink className="h-4 w-4 mr-1" />
                      Edit VASP
                    </Link>
                    <button
                      onClick={() => handleProcess(notification.id)}
                      disabled={processingId === notification.id}
                      className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50"
                    >
                      {processingId === notification.id ? (
                        <>
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-1"></div>
                          Processing...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Mark Processed
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default UpdateNotifications;