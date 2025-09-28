import { NextResponse } from "next/server";
import { connectToDB } from "@/lib/mongodb";
import ParkedVehicle from "@/models/ParkedVehicle";

export async function POST(req: Request) {
  try {
    const { slotNumber, floorNumber, vehicleNumber, vehicleType } = await req.json();
    if (!slotNumber || !floorNumber || !vehicleNumber || !vehicleType)
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });

    await connectToDB();

    // Check if slot is already occupied on this floor
    const existingVehicle = await ParkedVehicle.findOne({ 
      slotNumber, 
      floorNumber,
      vehicleType 
    });
    
    if (existingVehicle) {
      return NextResponse.json({ error: "Slot already occupied" }, { status: 400 });
    }

    const newPark = await ParkedVehicle.create({ 
      slotNumber, 
      floorNumber,
      vehicleNumber, 
      vehicleType 
    });

    return NextResponse.json({ success: true, data: newPark });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
