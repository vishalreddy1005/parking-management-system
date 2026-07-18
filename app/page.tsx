"use client";

import { useState, useEffect } from "react";

type VehicleType = "SUV" | "Sedan" | "Heavy" | "TwoWheeler";

const categories: Record<VehicleType, { slots: number; pricePerHour: number }> = {
  SUV: { slots: 10, pricePerHour: 150 },
  Sedan: { slots: 10, pricePerHour: 120 },
  Heavy: { slots: 4, pricePerHour: 200 },
  TwoWheeler: { slots: 7, pricePerHour: 50 },
};

const TOTAL_FLOORS = 5; // adjust this number

export default function Home() {
  const [vehicleNumber, setVehicleNumber] = useState("");
  const [vehicleType, setVehicleType] = useState<VehicleType>("SUV");
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
  const [selectedFloor, setSelectedFloor] = useState(1);
  const [currentFloor, setCurrentFloor] = useState(1);
  const [occupiedSlots, setOccupiedSlots] = useState<
    { type: string; slotNumber: number; floorNumber: number }[]
  >([]);
  const [message, setMessage] = useState("");

  const fetchOccupiedSlots = async () => {
    const res = await fetch("/api/slots");
    const data = await res.json();
    if (data.success) {
      setOccupiedSlots(data.occupiedSlots);
    } else {
      setMessage("Error fetching slots: " + data.error);
    }
  };

  useEffect(() => {
    fetchOccupiedSlots();
  }, []);

  const handlePark = async () => {
    if (selectedSlot === null || !vehicleNumber) {
      setMessage("Please select a slot, vehicle type and enter vehicle number.");
      return;
    }

    const confirm = window.confirm(
      `Park vehicle ${vehicleNumber} (${vehicleType}) in Floor ${selectedFloor}, Slot ${selectedSlot}?`
    );
    if (!confirm) return;

    const res = await fetch("/api/park", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        slotNumber: selectedSlot,
        floorNumber: selectedFloor,
        vehicleNumber,
        vehicleType,
      }),
    });

    const data = await res.json();
    if (data.success) {
      setMessage(`Vehicle parked in Floor ${selectedFloor}, ${vehicleType} slot ${selectedSlot}`);
      setVehicleNumber("");
      setSelectedSlot(null);
      fetchOccupiedSlots();
    } else {
      setMessage("Error: " + data.error);
    }
  };

  const handleCheckout = async (type: VehicleType, slot: number, floor: number) => {
    const res = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slotNumber: slot, vehicleType: type, floorNumber: floor }),
    });

    const data = await res.json();
    if (!data.success) {
      setMessage("Error: " + data.error);
      return;
    }

    const { bill, vehicleNumber, parkedHours } = data;

    const confirmPayment = window.confirm(
      `Vehicle ${vehicleNumber} parked for ${parkedHours} hour(s).\nRate: ₹${categories[type].pricePerHour}/hour\nTotal bill: ₹${bill}.\nConfirm payment?`
    );
    if (!confirmPayment) return;

    await fetch("/api/checkout/confirm", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ slotNumber: slot, vehicleType: type, floorNumber: floor }),
    });

    setMessage(`Floor ${floor}, Slot ${slot} (${type}) is now free. Payment of ₹${bill} received.`);
    fetchOccupiedSlots();
  };

  return (
    <main className="flex flex-col items-center justify-center min-h-screen p-8 bg-gray-100 text-gray-900">
      <h1 className="text-4xl font-bold mb-6">Parking Management System</h1>
      
      {/* Floor Selector */}
      <div className="mb-6 flex items-center space-x-4">
        <label htmlFor="floor-select" className="text-lg font-medium">
          Select Floor:
        </label>
        <select
          id="floor-select"
          value={currentFloor}
          onChange={(e) => {
            const floor = parseInt(e.target.value);
            setCurrentFloor(floor);
            setSelectedFloor(floor);
            setSelectedSlot(null); // Reset selected slot when changing floors
          }}
          className="border border-gray-300 rounded px-3 py-2 bg-white text-gray-900 shadow"
        >
          {Array.from({ length: TOTAL_FLOORS }, (_, i) => (
            <option key={i + 1} value={i + 1}>
              Floor {i + 1}
            </option>
          ))}
        </select>
      </div>

      <h2 className="text-2xl font-semibold mb-4 text-blue-600">
        Currently Viewing: Floor {currentFloor}
      </h2>

      {/* Floor Summary */}
      <div className="mb-6 p-4 bg-white rounded-lg shadow-md w-full max-w-4xl">
        <h3 className="text-lg font-semibold mb-3">Floor Occupancy Summary</h3>
        <div className="grid grid-cols-5 gap-4">
          {Array.from({ length: TOTAL_FLOORS }, (_, i) => {
            const floorNum = i + 1;
            const floorOccupancy = occupiedSlots.filter(slot => slot.floorNumber === floorNum).length;
            const totalSlots = Object.values(categories).reduce((sum, cat) => sum + cat.slots, 0);
            const occupancyPercentage = Math.round((floorOccupancy / totalSlots) * 100);
            
            return (
              <div 
                key={floorNum} 
                className={`p-3 rounded border text-center cursor-pointer transition ${
                  currentFloor === floorNum 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-gray-50 hover:bg-gray-100'
                }`}
                onClick={() => {
                  setCurrentFloor(floorNum);
                  setSelectedFloor(floorNum);
                  setSelectedSlot(null);
                }}
              >
                <div className="font-semibold">Floor {floorNum}</div>
                <div className="text-sm">{floorOccupancy}/{totalSlots}</div>
                <div className="text-xs">{occupancyPercentage}% full</div>
              </div>
            );
          })}
        </div>
      </div>

      {Object.entries(categories).map(([type, info]) => (
        <div key={type} className="mb-10 w-full max-w-3xl">
          <h3 className="text-xl font-semibold mb-4">
            {type} Parking (₹{info.pricePerHour}/hr)
          </h3>
          <div className="grid grid-cols-5 gap-4">
            {Array.from({ length: info.slots }, (_, i) => {
              const slotNum = i + 1;
              const isOccupied = occupiedSlots.some(
                (s) => s.type === type && s.slotNumber === slotNum && s.floorNumber === currentFloor
              );
              return (
                <div key={slotNum} className="flex flex-col items-center">
                  <button
                    className={`p-4 rounded border w-24 text-lg font-semibold shadow-md transition ${
                      isOccupied
                        ? "bg-red-500 text-white cursor-not-allowed"
                        : selectedSlot === slotNum && vehicleType === type && selectedFloor === currentFloor
                        ? "bg-blue-600 text-white"
                        : "bg-green-200 hover:bg-green-300"
                    }`}
                    onClick={() => {
                      if (!isOccupied) {
                        setVehicleType(type as VehicleType);
                        setSelectedSlot(slotNum);
                        setSelectedFloor(currentFloor);
                      }
                    }}
                    disabled={isOccupied}
                  >
                    Slot {slotNum}
                  </button>
                  {isOccupied && (
                    <button
                      onClick={() => handleCheckout(type as VehicleType, slotNum, currentFloor)}
                      className="mt-2 text-sm bg-yellow-500 text-white px-3 py-1 rounded hover:bg-yellow-600"
                    >
                      Checkout
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}

      <input
        type="text"
        placeholder="Enter vehicle number"
        value={vehicleNumber}
        onChange={(e) => setVehicleNumber(e.target.value)}
        className="border p-3 rounded w-64 mb-4 text-gray-900 bg-white shadow"
      />

      <button
        onClick={handlePark}
        className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded shadow"
      >
        Park Vehicle
      </button>

      {message && <p className="mt-4 text-lg font-semibold text-green-700">{message}</p>}
    </main>
  );
}
