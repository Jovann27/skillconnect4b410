import mongoose from "mongoose";
import dotenv from "dotenv";
import User from "./models/userSchema.js";
import ServiceRequest from "./models/serviceRequest.js";

dotenv.config();

async function checkAndCreateData() {
  try {
    console.log("Connecting to database...");
    await mongoose.connect(process.env.MONGO_URI || "mongodb://localhost:27017/skillconnect");

    console.log("Checking users...");
    const users = await User.find({}).select('firstName lastName role verified skills');
    console.log("Users found:", users.length);
    users.forEach(u => {
      console.log(`- ${u.firstName} ${u.lastName}: role=${u.role}, verified=${u.verified}, skills=${u.skills}`);
    });

    console.log("\nChecking service requests...");
    const requests = await ServiceRequest.find({}).populate('requester', 'firstName lastName');
    console.log("Service requests found:", requests.length);
    requests.forEach(r => {
      console.log(`- ${r.typeOfWork}: status=${r.status}, requester=${r.requester ? r.requester.firstName + ' ' + r.requester.lastName : 'Unknown'}`);
    });

    // If no users exist, create a sample service provider
    if (users.length === 0) {
      console.log("\nNo users found. Creating sample service provider...");
      const sampleUser = await User.create({
        username: "serviceprovider1",
        firstName: "John",
        lastName: "Provider",
        email: "provider@example.com",
        phone: "1234567890",
        otherContact: "",
        address: "123 Provider St, City, State 12345",
        birthdate: new Date("1990-01-01"),
        occupation: "Electrician",
        employed: "Self-employed",
        role: "Service Provider",
        verified: true,
        skills: ["Electrical", "Wiring", "Repair"],
        certificates: ["Electrical License"],
        profilePic: "",
        validId: "ID123456",
        availability: "Available",
        acceptedWork: false,
        service: "Electrical Services",
        serviceRate: 500,
        serviceDescription: "Professional electrical services",
        isOnline: true,
        password: "password123",
        banned: false
      });
      console.log("Created sample service provider:", sampleUser.firstName, sampleUser.lastName);
    }

    // Update the current user's skills if they are corrupted
    const currentUser = users.find(u => u.firstName === "Jovann" && u.lastName === "Rolluque");
    if (currentUser && currentUser.skills && currentUser.skills.length > 0) {
      const skillsStr = currentUser.skills[0];
      if (skillsStr.includes("web developer")) {
        console.log("\nFixing corrupted skills for current user...");
        currentUser.skills = ["Plumbing", "Pipe Repair", "Cleaning", "Electrical"];
        await currentUser.save();
        console.log("Updated user skills to:", currentUser.skills);
      }
    }

    // If no service requests exist, create some sample ones
    if (requests.length === 0) {
      console.log("\nNo service requests found. Creating sample requests...");

      // Get the first user (or the sample one we just created)
      const requester = users[0] || await User.findOne({});

      if (requester) {
        const sampleRequests = [
          {
            requester: requester._id,
            name: "Kitchen Outlet Installation",
            address: "456 Sample St, City, State 12345",
            phone: "0987654321",
            typeOfWork: "Electrical Installation",
            time: "Morning",
            budget: 1500,
            notes: "Need 3 new outlets installed in kitchen",
            status: "Open"
          },
          {
            requester: requester._id,
            name: "Bathroom Light Fixture",
            address: "456 Sample St, City, State 12345",
            phone: "0987654321",
            typeOfWork: "Electrical Repair",
            time: "Afternoon",
            budget: 800,
            notes: "Bathroom light not working, need repair",
            status: "Open"
          },
          {
            requester: requester._id,
            name: "Ceiling Fan Installation",
            address: "456 Sample St, City, State 12345",
            phone: "0987654321",
            typeOfWork: "Electrical Installation",
            time: "Morning",
            budget: 1200,
            notes: "Install new ceiling fan in bedroom",
            status: "Open"
          }
        ];

        for (const requestData of sampleRequests) {
          await ServiceRequest.create(requestData);
        }
        console.log("Created 3 sample service requests");
      }
    }

    // Update existing requests with proper typeOfWork if they have undefined
    const undefinedRequests = await ServiceRequest.find({ typeOfWork: undefined });
    if (undefinedRequests.length > 0) {
      console.log(`\nFound ${undefinedRequests.length} requests with undefined typeOfWork. Updating...`);

      for (const request of undefinedRequests) {
        // Assign random typeOfWork based on existing patterns
        const workTypes = ["Plumbing", "Electrical", "Cleaning", "Carpentry", "Painting", "Repair"];
        request.typeOfWork = workTypes[Math.floor(Math.random() * workTypes.length)];
        await request.save();
      }
      console.log("Updated requests with proper typeOfWork values");
    }

    await mongoose.disconnect();
    console.log("\nDatabase check complete!");

  } catch (error) {
    console.error("Error:", error);
    process.exit(1);
  }
}

checkAndCreateData();
