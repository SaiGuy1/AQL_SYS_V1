
import React, { useState, useEffect } from 'react';
import { MapPin, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface JobLocationProps {
  location: {
    latitude: number;
    longitude: number;
    address: string;
  };
  onLocationUpdate: (location: {
    latitude: number;
    longitude: number;
    address: string;
  }) => void;
}

const JobLocationMap: React.FC<JobLocationProps> = ({ location, onLocationUpdate }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [mapUrl, setMapUrl] = useState('');
  const [geocoding, setGeocoding] = useState(false);

  // Update map when location changes (either address or coordinates)
  useEffect(() => {
    updateMap(location);
  }, [location.latitude, location.longitude, location.address]);

  // Function to update the map based on current location data
  const updateMap = async (currentLocation: typeof location) => {
    setIsLoading(true);
    
    // In a real app, we would use an actual mapping API
    // For this demo, we're still using a placeholder image but would update based on address
    const mockMapUrl = `/placeholder.svg`;
    
    // Simulate loading time for map rendering
    setTimeout(() => {
      setMapUrl(mockMapUrl);
      setIsLoading(false);
    }, 500);

    // In a real implementation with Google Maps API, we would do something like:
    // const url = `https://maps.googleapis.com/maps/api/staticmap?center=${currentLocation.latitude},${currentLocation.longitude}&zoom=14&size=600x300&markers=color:red%7C${currentLocation.latitude},${currentLocation.longitude}&key=YOUR_API_KEY`;
    // setMapUrl(url);
  };

  // Function to geocode an address to coordinates
  const geocodeAddress = async (address: string) => {
    if (!address || address.trim() === '') return;
    
    setGeocoding(true);
    
    try {
      // In a real app, we would make an API call to a geocoding service
      // For demo purposes, we'll simulate geocoding with random coordinates
      setTimeout(() => {
        // Simulate geocoding by generating coordinates somewhat close to Detroit
        const newLat = 42.33 + (Math.random() * 0.1 - 0.05);
        const newLng = -83.04 + (Math.random() * 0.1 - 0.05);
        
        onLocationUpdate({
          latitude: newLat,
          longitude: newLng,
          address: address
        });
        
        toast.success("Location updated successfully");
        setGeocoding(false);
      }, 800);
      
      // With a real geocoding API like Google Maps, we would do:
      /*
      const response = await fetch(`https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&key=YOUR_API_KEY`);
      const data = await response.json();
      
      if (data.results && data.results.length > 0) {
        const { lat, lng } = data.results[0].geometry.location;
        onLocationUpdate({
          latitude: lat,
          longitude: lng,
          address: address
        });
      }
      */
    } catch (error) {
      console.error("Geocoding error:", error);
      toast.error("Failed to update location");
    } finally {
      setGeocoding(false);
    }
  };

  const handleMapClick = () => {
    // In a real application, this would open a map selection dialog
    // For demo purposes, we'll just update with a slightly different location
    onLocationUpdate({
      latitude: location.latitude + (Math.random() * 0.01 - 0.005),
      longitude: location.longitude + (Math.random() * 0.01 - 0.005),
      address: location.address
    });
  };

  return (
    <div className="relative w-full h-full bg-gray-100 flex items-center justify-center">
      {isLoading ? (
        <div className="flex flex-col items-center justify-center">
          <Loader2 className="h-8 w-8 text-blue-500 animate-spin mb-2" />
          <div className="text-sm">Loading map...</div>
        </div>
      ) : (
        <>
          <div 
            className="absolute inset-0 bg-contain bg-center bg-no-repeat cursor-pointer"
            style={{ backgroundImage: `url(${mapUrl})` }}
            onClick={handleMapClick}
          />
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="relative">
              <MapPin className="h-8 w-8 text-red-500" strokeWidth={2} />
              {geocoding && (
                <div className="absolute -top-3 -right-3">
                  <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />
                </div>
              )}
            </div>
          </div>
          <div className="absolute bottom-2 left-2 bg-white p-2 rounded shadow text-xs max-w-[80%] truncate">
            {location.address || "No address set"}
          </div>
          <div className="absolute bottom-2 right-2 bg-white p-2 rounded shadow text-xs">
            Click to set location (demo)
          </div>
        </>
      )}
    </div>
  );
};

export default JobLocationMap;
