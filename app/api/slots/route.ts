import { NextResponse } from "next/server";
import { connectToDB } from "@/lib/mongodb";
import ParkedVehicle from "@/models/ParkedVehicle";

export async function GET() {
  try {
    await connectToDB();

    // Fetch all parked slots with vehicle type and floor
    const parked = await ParkedVehicle.find({}, { 
      slotNumber: 1, 
      floorNumber: 1,
      vehicleType: 1, 
      _id: 0 
    });

    const occupiedSlots = parked.map((p) => ({
      slotNumber: p.slotNumber,
      floorNumber: p.floorNumber,
      type: p.vehicleType
    }));

    return NextResponse.json({ success: true, occupiedSlots });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "An unknown error occurred";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
