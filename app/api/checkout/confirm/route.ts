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

    const deleted = await ParkedVehicle.findOneAndDelete({ 
      slotNumber, 
      vehicleType,
      floorNumber 
    });
    if (!deleted) {
      return NextResponse.json({ error: "Slot is already empty" }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
