import { NextResponse } from "next/server";
import { connectToDB } from "@/lib/mongodb";
import ParkedVehicle from "@/models/ParkedVehicle";

export async function POST(req: Request) {
  try {
    const { slotNumber, vehicleType, floorNumber } = await req.json();
    if (!slotNumber || !vehicleType || !floorNumber) {
      return NextResponse.json({ error: "Missing slotNumber, vehicleType, or floorNumber" }, { status: 400 });
    }

    await connectToDB();

    // Find the vehicle in the slot on the specified floor
    const parkedVehicle = await ParkedVehicle.findOne({ 
      slotNumber, 
      vehicleType, 
      floorNumber 
    });
    if (!parkedVehicle) {
      return NextResponse.json({ error: "Slot is already empty" }, { status: 400 });
    }

    // Calculate billable amount with correct pricing
    const parkedAt = parkedVehicle.parkedAt;
    const now = new Date();
    const diffMs = now.getTime() - parkedAt.getTime();
    const diffHours = Math.ceil(diffMs / (1000 * 60 * 60)); // round up to nearest hour
    
    // Get price per hour based on vehicle type
    const priceMap: Record<string, number> = {
      SUV: 150,
      Sedan: 120,
      Heavy: 200,
      TwoWheeler: 50
    };
    const pricePerHour = priceMap[vehicleType] || 100;
    
    const bill = diffHours * pricePerHour;

    // Return bill amount first; frontend will confirm payment
    return NextResponse.json({
      success: true,
      vehicleNumber: parkedVehicle.vehicleNumber,
      slotNumber: parkedVehicle.slotNumber,
      floorNumber: parkedVehicle.floorNumber,
      parkedHours: diffHours,
      bill,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "An unknown error occurred";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
