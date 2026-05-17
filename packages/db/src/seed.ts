import { pool, query } from "./connection";
import crypto from "crypto";

// Simple password hash (in production, use bcrypt — this is for seeding only)
function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password).digest("hex");
}

interface SeedPage {
  text_en: string;
  text_sq: string;
  image_url: string | null;
}

interface SeedStory {
  title: string;
  description: string;
  level: "beginner" | "medium" | "advanced";
  is_premium: boolean;
  is_published: boolean;
  pages: SeedPage[];
}

const stories: SeedStory[] = [
  // ── Beginner (free) ─────────────────────────
  {
    title: "The Happy Morning",
    description: "A calm start to the day, one gentle step at a time.",
    level: "beginner",
    is_premium: false,
    is_published: true,
    pages: [
      { text_en: "The sun rises slowly. Warm light fills the room.", text_sq: "Dielli lind ngadalë. Drita e ngrohtë mbush dhomën.", image_url: null },
      { text_en: "I open my eyes. I take a deep breath in, and out.", text_sq: "Hap sytë. Marr frymë thellë, brenda dhe jashtë.", image_url: null },
      { text_en: "I sit up. My feet touch the soft floor.", text_sq: "Ulem. Këmbët e mia prekin dyshemenë e butë.", image_url: null },
      { text_en: "I stretch my arms up high. I am ready for the day.", text_sq: "Shtrij krahët lart. Jam gati për ditën.", image_url: null },
      { text_en: "Today will be a good day. One small step at a time.", text_sq: "Sot do të jetë një ditë e mirë. Një hap i vogël në një kohë.", image_url: null },
    ],
  },
  {
    title: "My Big Feelings",
    description: "Understanding that all feelings are okay.",
    level: "beginner",
    is_premium: false,
    is_published: true,
    pages: [
      { text_en: "Sometimes I feel happy. Sometimes I feel sad.", text_sq: "Ndonjëherë ndihem i lumtur. Ndonjëherë ndihem i trishtuar.", image_url: null },
      { text_en: "Sometimes I feel angry. That is okay too.", text_sq: "Ndonjëherë ndihem i zemëruar. Edhe kjo është në rregull.", image_url: null },
      { text_en: "Feelings come and go, like clouds in the sky.", text_sq: "Ndjenjat vijnë dhe shkojnë, si retë në qiell.", image_url: null },
      { text_en: "When I feel a lot, I can take three slow breaths.", text_sq: "Kur ndjej shumë, mund të marr tre frymëmarrje të ngadalta.", image_url: null },
      { text_en: "Breathe in... breathe out. I am safe.", text_sq: "Merr frymë brenda... nxirr jashtë. Jam i sigurt.", image_url: null },
      { text_en: "All of my feelings are part of me. And that is good.", text_sq: "Të gjitha ndjenjat e mia janë pjesë e meje. Dhe kjo është mirë.", image_url: null },
    ],
  },
  {
    title: "Brushing My Teeth",
    description: "A step-by-step guide to brushing teeth.",
    level: "beginner",
    is_premium: false,
    is_published: true,
    pages: [
      { text_en: "It is time to brush my teeth.", text_sq: "Është koha për të larë dhëmbët.", image_url: null },
      { text_en: "I pick up my toothbrush. I put a little toothpaste on it.", text_sq: "Marr furçën e dhëmbëve. Vë pak pastë dhëmbësh.", image_url: null },
      { text_en: "I brush the top teeth. Up and down, up and down.", text_sq: "Laj dhëmbët e sipërm. Lart e poshtë, lart e poshtë.", image_url: null },
      { text_en: "I brush the bottom teeth. Nice and gentle.", text_sq: "Laj dhëmbët e poshtëm. Bukur dhe butë.", image_url: null },
      { text_en: "I spit into the sink and rinse with water.", text_sq: "Pështyj në lavaman dhe shpëlaj me ujë.", image_url: null },
      { text_en: "All done! My teeth feel clean and smooth.", text_sq: "U krye! Dhëmbët e mi ndihen të pastër dhe të lëmuar.", image_url: null },
    ],
  },

  // ── Medium (free) ───────────────────────────
  {
    title: "Learning to Share",
    description: "Mia and Sam learn that sharing feels good.",
    level: "medium",
    is_premium: false,
    is_published: true,
    pages: [
      { text_en: "Mia has two red blocks. Sam has none.", text_sq: "Mia ka dy kube të kuq. Sami nuk ka asnjë.", image_url: null },
      { text_en: "Mia thinks. She gives one block to Sam.", text_sq: "Mia mendon. Ajo i jep një kub Samit.", image_url: null },
      { text_en: "Sam smiles. 'Thank you, Mia!'", text_sq: "Sami buzëqesh. 'Faleminderit, Mia!'", image_url: null },
      { text_en: "Now they both have a block. They can build together.", text_sq: "Tani të dy kanë nga një kub. Mund të ndërtojnë së bashku.", image_url: null },
      { text_en: "Mia feels warm inside. Sharing felt good.", text_sq: "Mia ndihet ngrohtë brenda. Të ndash diçka ishte e bukur.", image_url: null },
      { text_en: "Sam shares his blue crayon with Mia. They are friends.", text_sq: "Sami ndan bojën e kaltër me Mian. Ata janë miq.", image_url: null },
      { text_en: "Sharing is a way to show we care about others.", text_sq: "Ndarja është një mënyrë për të treguar se kujdesemi për të tjerët.", image_url: null },
    ],
  },
  {
    title: "Going to the Store",
    description: "Practice what happens when you visit a store.",
    level: "medium",
    is_premium: false,
    is_published: true,
    pages: [
      { text_en: "Today we are going to the store.", text_sq: "Sot do të shkojmë në dyqan.", image_url: null },
      { text_en: "We walk inside. It might be bright and noisy.", text_sq: "Hyjmë brenda. Mund të jetë e ndriçme dhe e zhurmshme.", image_url: null },
      { text_en: "If it feels loud, I can cover my ears gently. That is okay.", text_sq: "Nëse duket e zhurmshme, mund t'i mbuloj veshët butë. Kjo është në rregull.", image_url: null },
      { text_en: "We pick the things we need from the shelves.", text_sq: "Marrim gjërat që na duhen nga raftet.", image_url: null },
      { text_en: "We wait in line. Waiting can be hard, but I can do it.", text_sq: "Presim në radhë. Pritja mund të jetë e vështirë, por unë mundem.", image_url: null },
      { text_en: "We pay and say 'thank you'. Good job!", text_sq: "Paguajmë dhe themi 'faleminderit'. Punë e mirë!", image_url: null },
      { text_en: "We walk back to the car. The trip is done.", text_sq: "Kthehemi te makina. Udhëtimi mbaroi.", image_url: null },
    ],
  },
  {
    title: "Waiting My Turn",
    description: "Learning that good things come to those who wait.",
    level: "medium",
    is_premium: false,
    is_published: true,
    pages: [
      { text_en: "At the playground, I want to go on the swing.", text_sq: "Në këndin e lojërave, dua të hipi në lëkundëse.", image_url: null },
      { text_en: "But someone else is swinging. I need to wait.", text_sq: "Por dikush tjetër po lëkundet. Duhet të pres.", image_url: null },
      { text_en: "Waiting is hard. My body wants to move.", text_sq: "Pritja është e vështirë. Trupi im dëshiron të lëvizë.", image_url: null },
      { text_en: "I can count to ten while I wait. 1... 2... 3...", text_sq: "Mund të numëroj deri në dhjetë ndërsa pres. 1... 2... 3...", image_url: null },
      { text_en: "Now it is my turn! I sit on the swing.", text_sq: "Tani është radha ime! Ulem në lëkundëse.", image_url: null },
      { text_en: "I pump my legs. Back and forth, back and forth.", text_sq: "Lëviz këmbët. Para e mbrapa, para e mbrapa.", image_url: null },
      { text_en: "Waiting was worth it. I feel proud I was patient.", text_sq: "Pritja ia vlente. Ndihem krenar që isha i durueshëm.", image_url: null },
    ],
  },

  // ── Medium (premium) ────────────────────────
  {
    title: "First Day of School",
    description: "What to expect on a brand new school day.",
    level: "medium",
    is_premium: true,
    is_published: true,
    pages: [
      { text_en: "Today is my first day of school. I feel nervous.", text_sq: "Sot është dita ime e parë e shkollës. Ndihem nervoz.", image_url: null },
      { text_en: "Mum says: 'It is okay to feel nervous. I will be here after.'", text_sq: "Mama thotë: 'Është në rregull të ndihesh nervoz. Do të jem këtu pas.'", image_url: null },
      { text_en: "I walk into the classroom. It smells like crayons.", text_sq: "Hyj në klasë. Kundërmon si boja.", image_url: null },
      { text_en: "The teacher smiles and says my name. She knows me.", text_sq: "Mësuesja buzëqesh dhe thotë emrin tim. Ajo më njeh.", image_url: null },
      { text_en: "I find my seat. There is a name tag on the desk.", text_sq: "Gjej vendin tim. Ka një etiketë me emrin tim në bankë.", image_url: null },
      { text_en: "We draw pictures. I draw my cat.", text_sq: "Vizatojmë. Unë vizatoj macen time.", image_url: null },
      { text_en: "The bell rings. Mum is waiting outside, just like she said.", text_sq: "Zilja bie. Mama po pret jashtë, ashtu siç tha.", image_url: null },
      { text_en: "School was okay. Maybe tomorrow will be even better.", text_sq: "Shkolla ishte në rregull. Ndoshta nesër do të jetë edhe më mirë.", image_url: null },
      { text_en: "I did it. I went to school.", text_sq: "Ia dola. Shkova në shkollë.", image_url: null },
    ],
  },

  // ── Advanced (free) ─────────────────────────
  {
    title: "Saying Hello",
    description: "A gentle guide to greeting someone new.",
    level: "advanced",
    is_premium: false,
    is_published: true,
    pages: [
      { text_en: "I see someone I do not know.", text_sq: "Shoh dikë që nuk e njoh.", image_url: null },
      { text_en: "I can look near their face. Not staring, just a glance.", text_sq: "Mund të shikoj pranë fytyrës së tyre. Jo duke vështruar, vetëm një shikim.", image_url: null },
      { text_en: "I can wave my hand, or I can say 'Hi'.", text_sq: "Mund të bëj me dorë, ose mund të them 'Përshëndetje'.", image_url: null },
      { text_en: "They might say 'Hi' back. Or they might not. Both are fine.", text_sq: "Ata mund të thonë 'Përshëndetje' mbrapsht. Ose mund të mos e bëjnë. Të dyja janë në rregull.", image_url: null },
      { text_en: "If they talk to me, I can listen.", text_sq: "Nëse ata flasin me mua, mund të dëgjoj.", image_url: null },
      { text_en: "I can say my name: 'I am ___.'", text_sq: "Mund të them emrin tim: 'Unë jam ___.'", image_url: null },
      { text_en: "That is all I need to do. I said hello.", text_sq: "Kjo është gjithshka që duhet të bëj. Thashë përshëndetje.", image_url: null },
      { text_en: "Saying hello gets easier every time I try.", text_sq: "Të thuash përshëndetje bëhet më e lehtë sa herë që provoj.", image_url: null },
    ],
  },

  // ── Advanced (premium) ──────────────────────
  {
    title: "Making a Friend",
    description: "A story about meeting someone new and playing together.",
    level: "advanced",
    is_premium: true,
    is_published: true,
    pages: [
      { text_en: "At the park, I see another child playing.", text_sq: "Në park, shoh një fëmijë tjetër duke luajtur.", image_url: null },
      { text_en: "I walk a little closer. Not too close.", text_sq: "Ecë pak më pranë. Jo shumë pranë.", image_url: null },
      { text_en: "I can say: 'Hi, my name is ___. What is yours?'", text_sq: "Mund të them: 'Përshëndetje, emri im është ___. Si e ke ti?'", image_url: null },
      { text_en: "They might say their name. That means they want to talk.", text_sq: "Ata mund të thonë emrin e tyre. Kjo do të thotë se duan të flasin.", image_url: null },
      { text_en: "I can ask: 'Do you want to play?'", text_sq: "Mund të pyes: 'Dëshiron të luajmë?'", image_url: null },
      { text_en: "If they say yes, we play together. If they say no, that is okay too.", text_sq: "Nëse thonë po, luajmë së bashku. Nëse thonë jo, edhe kjo është në rregull.", image_url: null },
      { text_en: "We take turns on the slide. One, then the other.", text_sq: "Bëjmë me radhë në rrëshqitëse. Njëri, pastaj tjetri.", image_url: null },
      { text_en: "Playing together is fun. I made a new friend!", text_sq: "Të luash së bashku është argëtuese. Bëra një mik të ri!", image_url: null },
    ],
  },
  {
    title: "When Things Change",
    description: "Learning to handle unexpected changes to plans.",
    level: "advanced",
    is_premium: true,
    is_published: true,
    pages: [
      { text_en: "We were going to the park today. I was excited.", text_sq: "Do të shkonim në park sot. Isha i emocionuar.", image_url: null },
      { text_en: "But then it started to rain. We cannot go.", text_sq: "Por pastaj filloi të binte shi. Nuk mundemi të shkojmë.", image_url: null },
      { text_en: "I feel upset. My plan has changed.", text_sq: "Ndihem i mërzitur. Plani im ka ndryshuar.", image_url: null },
      { text_en: "Dad says: 'I know this is hard. Let's make a new plan.'", text_sq: "Babi thotë: 'E di që kjo është e vështirë. Le të bëjmë një plan të ri.'", image_url: null },
      { text_en: "We can play inside instead. We build a fort with blankets.", text_sq: "Mund të luajmë brenda. Ndërtojmë një kështjellë me batanije.", image_url: null },
      { text_en: "The fort is cozy and quiet. I like it in here.", text_sq: "Kështjella është e ngrohtë dhe e qetë. Më pëlqen këtu.", image_url: null },
      { text_en: "Sometimes plans change. That is okay.", text_sq: "Ndonjëherë planet ndryshojnë. Kjo është në rregull.", image_url: null },
      { text_en: "New plans can be good too.", text_sq: "Planet e reja mund të jenë edhe të mira.", image_url: null },
    ],
  },
];

async function seed() {
  console.log("Seeding database...\n");

  // Clear existing data (reverse FK order)
  await query("DELETE FROM story_pages");
  await query("DELETE FROM stories");
  await query("DELETE FROM users");

  // Create default admin user
  const adminPassword = hashPassword("admin123");
  const [admin] = await query(
    `INSERT INTO users (email, password_hash, name, role)
     VALUES ($1, $2, $3, $4)
     RETURNING id`,
    ["admin@littleworld.app", adminPassword, "Admin User", "admin"]
  );

  console.log("  Admin user created (admin@littleworld.app / admin123)");

  // Insert stories and pages
  let freeCount = 0;
  let premiumCount = 0;

  for (const story of stories) {
    const [created] = await query(
      `INSERT INTO stories (title, description, level, is_premium, is_published, created_by)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id`,
      [
        story.title,
        story.description,
        story.level,
        story.is_premium,
        story.is_published,
        admin.id,
      ]
    );

    for (let i = 0; i < story.pages.length; i++) {
      await query(
        `INSERT INTO story_pages (story_id, page_number, text_sq, text_en, image_url)
         VALUES ($1, $2, $3, $4, $5)`,
        [created.id, i + 1, story.pages[i].text_sq, story.pages[i].text_en, story.pages[i].image_url]
      );
    }

    const tag = story.is_premium ? "premium" : "free";
    if (story.is_premium) premiumCount++;
    else freeCount++;

    console.log(
      `  "${story.title}" [${story.level}] (${story.pages.length} pages, ${tag})`
    );
  }

  console.log(
    `\nSeeding complete: ${freeCount} free + ${premiumCount} premium = ${stories.length} stories.`
  );
  await pool.end();
}

seed().catch((err) => {
  console.error("Seeding failed:", err);
  process.exit(1);
});
