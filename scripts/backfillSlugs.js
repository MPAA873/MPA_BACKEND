import mongoose from "mongoose";
import dotenv from "dotenv";
import Manuscript from "../src/Modules/manuscript/manuscript.model.js"; 

dotenv.config();

const DRY_RUN = true; 
const generateSlug = (title) =>
  title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

const run = async () => {
  await mongoose.connect(process.env.MONGO_URI);

  const manuscripts = await Manuscript.find({
    $or: [{ slug: { $exists: false } }, { slug: null }, { slug: "" }],
  });

  console.log(`Found ${manuscripts.length} manuscripts without slug.`);
  console.log(DRY_RUN ? "MODE: DRY RUN (nothing will be saved)\n" : "MODE: LIVE (will save to DB)\n");

  for (const m of manuscripts) {
    const baseSlug = generateSlug(m.title) || `paper-${m._id.toString().slice(-6)}`;
    let slug = baseSlug;
    let count = 1;

    while (await Manuscript.findOne({ slug, _id: { $ne: m._id } })) {
      slug = `${baseSlug}-${count++}`;
    }

    console.log(`✔ ${m.manuscriptId || m._id} → "${m.title}" → slug: ${slug}`);

    if (!DRY_RUN) {
      m.slug = slug;
      await m.save();
    }
  }

  console.log("\nDone.");
  process.exit(0);
};

run().catch((err) => {
  console.error(err);
  process.exit(1);
});