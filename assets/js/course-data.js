/**
 * ============================================================
 * FILE: assets/js/course-data.js
 * ============================================================
 *
 * 1. PURPOSE
 *    All learning CONTENT of EduSpace in one place: the 12 demonstration
 *    courses, their modules, lessons (original text lessons) and quizzes.
 *    Other files only READ this data; nothing here runs on its own.
 *
 * 2. MAIN FUNCTIONALITY / IMPORTANT SECTIONS
 *    window.COURSE_CATEGORIES  the category chips (All, IT & Software, ...)
 *    window.COURSES            the course list. Each course has:
 *      id, title, category, instructor, rating (SAMPLE), studentsDemo
 *      (DEMONSTRATION number), difficulty, published (fictional date),
 *      color (card pastel), thumbnail, summary, description, objectives,
 *      prerequisites, modules -> lessons, quiz -> questions.
 *    A lesson: { id, title, minutes (estimated study time), summary,
 *      body (paragraphs), points (key points), code (optional),
 *      practice (a small task) }.
 *    A question: { id, text, options (exactly 4), correct (index 0-3),
 *      explanation }.
 *
 * 3. DEPENDENCIES
 *    None. Loaded right after config.js on every page.
 *
 * 4. HOW TO CUSTOMIZE IT (safe to edit)
 *    - Change any text freely.
 *    - Add a course: copy one course object, give it a NEW unique id and
 *      new lesson / quiz ids. Ids are stored in the student's saved
 *      progress, so do NOT rename ids of courses students already use.
 *    - Every question needs exactly 4 options and a "correct" index.
 *    - Course duration is NOT typed by hand: it is the sum of the lesson
 *      "minutes" values (see getCourseMinutes() in courses.js).
 *
 * 5. HOW ANALYTICS IS INTEGRATED
 *    The ids in this file (course id, lesson id, quiz id, category id)
 *    are the anonymous identifiers sent to GA4 as course_id, lesson_id,
 *    quiz_id and course_category. Titles are never needed for analysis.
 *
 * HONESTY NOTES
 *    - Instructors are FICTIONAL profiles.
 *    - "rating" values are SAMPLE ratings, "studentsDemo" values are
 *      DEMONSTRATION numbers. The interface labels both.
 *    - Lessons are original short text lessons written for this demo, not
 *      copies of any real course. No fake video players are used.
 * ============================================================
 */

// ==========================================
// GA4 AND GTM EVENT TRACKING SECTION
// ==========================================
// This file sends NO events. It only defines the ids that other files
// send as event parameters (course_id, lesson_id, quiz_id, course_category).

window.COURSE_CATEGORIES = [
  { id: "all", label: "All" },
  { id: "it-software", label: "IT & Software" },
  { id: "media-training", label: "Media Training" },
  { id: "business", label: "Business" },
  { id: "interior-design", label: "Interior Design" },
  { id: "data-science", label: "Data Science" },
  { id: "cybersecurity", label: "Cybersecurity" }
];

window.COURSES = [
  /* ---------------------------------------------------------- 1 */
  {
    id: "ccna-boot-camp",
    title: "CCNA 200-120-125 Video Boot Camp",
    category: "it-software",
    instructor: { name: "Daniel Okafor", role: "Network engineer (fictional profile)", bio: "Fictional instructor profile. Represents a network engineer who has designed campus networks and teaches certification candidates to think in layers." },
    rating: 4.8, ratingCount: 2140, studentsDemo: 18450,
    difficulty: "intermediate", published: "2026-02-10", color: "lavender",
    thumbnail: "assets/images/courses/ccna.svg",
    summary: "Networking foundations for the Cisco CCNA exam: models, addressing, switching and routing.",
    description: "This boot camp walks through the ideas every CCNA candidate must master. You will learn how data moves through the OSI and TCP/IP models, calculate IPv4 subnets by hand, see how switches build their MAC address tables and configure your first static routes. The demonstration version contains four text lessons and a graded quiz; the full title refers to the exam versions the course structure is based on.",
    objectives: ["Explain the purpose of each OSI layer", "Calculate subnets and usable hosts for any IPv4 prefix", "Describe how a switch learns and forwards frames", "Read a routing table and configure a static route"],
    prerequisites: ["Basic computer skills", "No previous networking experience required"],
    modules: [
      {
        id: "m1", title: "Networking Foundations", lessons: [
          { id: "l1", title: "The OSI and TCP/IP Models", minutes: 12,
            summary: "Why networks are described in layers and what each layer does.",
            body: ["Networking models split communication into layers so that each layer solves one problem. The OSI model has seven layers: Physical, Data Link, Network, Transport, Session, Presentation and Application. The TCP/IP model used on the real internet groups them into four: Link, Internet, Transport and Application.",
              "When you send data, each layer adds its own header in a process called encapsulation. The Transport layer creates segments and adds port numbers, the Network layer creates packets with IP addresses, and the Data Link layer creates frames with MAC addresses. The receiving device removes the headers in reverse order.",
              "Troubleshooting becomes easier with layers. If a cable is unplugged, the problem is at Layer 1. If the IP address is wrong, the problem is at Layer 3. Engineers often work from the bottom up."],
            points: ["OSI has 7 layers, TCP/IP has 4", "Layer 3 (Network) handles logical addressing and routing", "Encapsulation adds a header at every layer"],
            practice: "Write the seven OSI layers from bottom to top and name one protocol or device for each." },
          { id: "l2", title: "IPv4 Addressing and Subnetting", minutes: 18,
            summary: "Reading prefixes and calculating networks, broadcasts and usable hosts.",
            body: ["An IPv4 address has 32 bits written as four decimal numbers, for example 192.168.10.37. The prefix length, such as /26, tells you how many bits belong to the network. The remaining bits identify hosts.",
              "A /26 leaves 6 host bits. 2 to the power of 6 is 64 addresses, but the first is the network address and the last is the broadcast address, so 62 addresses are usable for hosts. The same formula works for every prefix: usable hosts = 2^(host bits) - 2.",
              "To find the network an address belongs to, look at the block size. For /26 the block size in the last octet is 64, so the networks start at .0, .64, .128 and .192. The address 192.168.10.37 is in the 192.168.10.0/26 network, whose broadcast is 192.168.10.63."],
            points: ["Usable hosts = 2^(host bits) - 2", "A /26 has 64 addresses and 62 usable hosts", "Block size helps find network and broadcast addresses"],
            code: "Prefix  Host bits  Addresses  Usable\n/24     8          256        254\n/25     7          128        126\n/26     6          64         62\n/27     5          32         30",
            practice: "Find the network and broadcast address of 10.1.1.200/27." }
        ]
      },
      {
        id: "m2", title: "Switching and Routing", lessons: [
          { id: "l3", title: "How Switches Learn MAC Addresses", minutes: 14,
            summary: "MAC address tables, flooding and forwarding inside a LAN.",
            body: ["A switch works at Layer 2. When a frame arrives, the switch records the SOURCE MAC address and the port it came from in its MAC address table. This is how it learns where devices are.",
              "To forward the frame, the switch looks up the DESTINATION MAC address. If the address is in the table, the frame goes out only that port. If it is unknown, or the frame is a broadcast, the switch floods it out of every port except the one it arrived on.",
              "Entries age out after a period of inactivity (300 seconds by default on Cisco switches), so the table stays current when devices move."],
            points: ["Switches learn from source MAC addresses", "They forward using destination MAC addresses", "Unknown destinations and broadcasts are flooded"],
            practice: "Sketch a switch with three PCs and describe the table after PC1 sends a frame to PC3." },
          { id: "l4", title: "Routing Basics and Static Routes", minutes: 16,
            summary: "How routers choose paths and how to add a static route.",
            body: ["Routers connect different IP networks. Each router keeps a routing table listing destination networks and the next hop or exit interface for each. When a packet arrives, the router chooses the most specific matching route (the longest prefix).",
              "Routes can be directly connected, static (typed by an administrator) or learned through dynamic protocols such as OSPF. When two sources offer the same route, the router prefers the lower administrative distance: connected = 0, static = 1, OSPF = 110.",
              "A static route on a Cisco router is configured with one command. A default route, 0.0.0.0/0, matches every destination and is used when nothing more specific exists."],
            points: ["Longest prefix match wins", "Administrative distance: connected 0, static 1, OSPF 110", "0.0.0.0/0 is the default route"],
            code: "Router(config)# ip route 192.168.20.0 255.255.255.0 10.0.0.2\nRouter(config)# ip route 0.0.0.0 0.0.0.0 203.0.113.1",
            practice: "Write the command for a static route to 172.16.5.0/24 via next hop 10.0.0.9." }
        ]
      }
    ],
    quiz: {
      id: "ccna-boot-camp-quiz", title: "Networking Foundations Check",
      questions: [
        { id: "q1", text: "Which OSI layer is responsible for logical addressing and routing?", options: ["Data Link", "Network", "Transport", "Session"], correct: 1, explanation: "The Network layer (Layer 3) adds IP addresses and routers make path decisions there." },
        { id: "q2", text: "How many usable host addresses does a /26 subnet provide?", options: ["30", "62", "64", "126"], correct: 1, explanation: "A /26 leaves 6 host bits: 2^6 = 64 addresses minus network and broadcast = 62." },
        { id: "q3", text: "What does a switch use to decide where to forward a frame?", options: ["The destination IP address", "The source port number", "The destination MAC address and its MAC address table", "The routing table"], correct: 2, explanation: "Switches forward frames by looking up the destination MAC address in their MAC address table." },
        { id: "q4", text: "What is the default administrative distance of a static route on a Cisco router?", options: ["0", "1", "90", "110"], correct: 1, explanation: "Connected routes have 0, static routes 1, EIGRP 90 and OSPF 110." },
        { id: "q5", text: "Which protocol finds the MAC address that belongs to a known IPv4 address?", options: ["DNS", "DHCP", "ARP", "ICMP"], correct: 2, explanation: "ARP (Address Resolution Protocol) maps IPv4 addresses to MAC addresses on the local network." }
      ]
    }
  },

  /* ---------------------------------------------------------- 2 */
  {
    id: "business-writing",
    title: "Powerful Business Writing",
    category: "media-training",
    instructor: { name: "Grace Whitfield", role: "Communications coach (fictional profile)", bio: "Fictional instructor profile. Represents a former newsroom editor who now coaches teams to write messages that get read and acted on." },
    rating: 4.7, ratingCount: 980, studentsDemo: 9320,
    difficulty: "beginner", published: "2026-05-02", color: "pink",
    thumbnail: "assets/images/courses/writing.svg",
    summary: "Write emails, reports and updates that are clear, short and easy to act on.",
    description: "Readers at work are busy. This course teaches a simple, repeatable process: understand the reader, put the main point first, cut every unnecessary word and finish with a clear request. Each lesson includes before-and-after examples you can reuse.",
    objectives: ["Plan a message around the reader's needs", "Use the Bottom Line Up Front structure", "Remove wordy phrases and passive constructions", "Write emails with clear subject lines and requests"],
    prerequisites: ["None"],
    modules: [
      {
        id: "m1", title: "Clear Thinking on the Page", lessons: [
          { id: "l1", title: "Start With the Reader", minutes: 10,
            summary: "Three questions to answer before you type anything.",
            body: ["Good business writing begins before the first sentence. Ask three questions: Who is reading? What do they already know? What do I want them to do after reading?",
              "A finance director and a new intern need different levels of detail about the same project. Writing for the reader means choosing what to leave out as much as what to include.",
              "Write your purpose in one sentence on a sticky note. If you cannot, you are not ready to write the message yet."],
            points: ["Identify the reader before writing", "Decide the action you want", "One-sentence purpose test"],
            practice: "Pick an email you must send this week and write its purpose in one sentence." },
          { id: "l2", title: "The Bottom Line Up Front", minutes: 9,
            summary: "Lead with the conclusion, then support it.",
            body: ["BLUF stands for Bottom Line Up Front. The most important information, usually a decision, request or conclusion, appears in the first one or two sentences.",
              "Compare: 'Following several meetings and a review of three vendors...' with 'I recommend we choose Vendor B; it is 12% cheaper and can start in March.' The second version lets a busy reader act immediately.",
              "Supporting details follow in order of importance. A reader who stops after the first paragraph should still know what you need."],
            points: ["Put the decision or request first", "Order details by importance", "A reader who stops early should still understand"],
            practice: "Rewrite the opening of an old report so the conclusion appears in the first sentence." }
        ]
      },
      {
        id: "m2", title: "Polishing Your Message", lessons: [
          { id: "l3", title: "Cutting Wordiness", minutes: 11,
            summary: "Short words, active voice and no filler.",
            body: ["Wordy phrases slow the reader down. 'Due to the fact that' becomes 'because'. 'At this point in time' becomes 'now'. 'In order to' usually becomes 'to'.",
              "Prefer the active voice, where the subject does the action: 'The team approved the budget' instead of 'The budget was approved by the team'. Active sentences are shorter and say who is responsible.",
              "Read your draft aloud. Wherever you run out of breath, the sentence is probably too long. Aim for an average of 15 to 20 words per sentence."],
            points: ["Replace wordy phrases with short words", "Active voice names who does what", "Average 15-20 words per sentence"],
            practice: "Find five wordy phrases in a recent document and replace them." },
          { id: "l4", title: "Writing Emails People Act On", minutes: 12,
            summary: "Subject lines, structure and a clear call to action.",
            body: ["A useful subject line tells the reader what the email is about and what is needed: 'Approval needed by Friday: Q3 travel budget' is better than 'Budget'.",
              "Keep one topic per email. Use short paragraphs and, when you list several items, number them so the reader can reply 'Yes to 1 and 3'.",
              "End with a specific request and a deadline: 'Please confirm the venue by Thursday 5 pm.' Vague endings such as 'Let me know your thoughts' often lead to no reply."],
            points: ["Subject line = topic + action", "One topic per email", "End with a specific request and deadline"],
            practice: "Rewrite three of your recent subject lines using the topic + action pattern." }
        ]
      }
    ],
    quiz: {
      id: "business-writing-quiz", title: "Business Writing Check",
      questions: [
        { id: "q1", text: "What does BLUF stand for?", options: ["Brief Language, Useful Facts", "Bottom Line Up Front", "Build, Link, Update, Finish", "Business Letter Universal Format"], correct: 1, explanation: "BLUF means Bottom Line Up Front: the conclusion or request comes first." },
        { id: "q2", text: "Which subject line is most effective?", options: ["Update", "Quick question", "Approval needed by Friday: Q3 travel budget", "Hello team"], correct: 2, explanation: "It states the topic and the action needed, including a deadline." },
        { id: "q3", text: "Which sentence uses the active voice?", options: ["The report was finished by Sam.", "Mistakes were made.", "Sam finished the report.", "The report has been finished."], correct: 2, explanation: "In 'Sam finished the report' the subject (Sam) performs the action." },
        { id: "q4", text: "What is the best short replacement for 'due to the fact that'?", options: ["because", "in light of", "owing to the reason", "considering that fact"], correct: 0, explanation: "'Because' says the same thing in one word." },
        { id: "q5", text: "What should you identify first when planning a business message?", options: ["The font", "The reader and the action you want from them", "The length of the email", "The number of attachments"], correct: 1, explanation: "Everything else depends on who reads the message and what they should do." }
      ]
    }
  },

  /* ---------------------------------------------------------- 3 */
  {
    id: "six-sigma-yellow",
    title: "Certified Six Sigma Yellow Belt Training",
    category: "business",
    instructor: { name: "Marcus Lindqvist", role: "Process improvement lead (fictional profile)", bio: "Fictional instructor profile. Represents a quality manager who has led improvement projects in manufacturing and healthcare." },
    rating: 4.6, ratingCount: 1310, studentsDemo: 11200,
    difficulty: "beginner", published: "2025-11-18", color: "peach",
    thumbnail: "assets/images/courses/sixsigma.svg",
    summary: "The language, DMAIC method and basic tools of Six Sigma process improvement.",
    description: "Yellow Belts support improvement projects and spot problems in their own work. This course introduces what Six Sigma measures, the five DMAIC phases and the simple tools teams use every day: process maps, SIPOC, Pareto charts and root-cause analysis. Note: this demonstration course does not award a real certification.",
    objectives: ["Explain what 'Six Sigma' quality means", "Name and order the DMAIC phases", "Build a SIPOC and a simple process map", "Use a Pareto chart and the 5 Whys to find root causes"],
    prerequisites: ["None", "Familiarity with your own work processes helps"],
    modules: [
      {
        id: "m1", title: "Six Sigma Essentials", lessons: [
          { id: "l1", title: "What Six Sigma Means", minutes: 10,
            summary: "Variation, defects and the 3.4 DPMO target.",
            body: ["Six Sigma is a data-driven method for reducing variation and defects in a process. A defect is anything that fails to meet a customer requirement, such as a late delivery or a wrong invoice.",
              "Quality is measured in defects per million opportunities (DPMO). A process operating at six sigma produces about 3.4 defects per million opportunities.",
              "Projects are run by trained roles: Champions sponsor them, Black Belts and Green Belts lead them, and Yellow Belts contribute process knowledge and help collect data."],
            points: ["A defect = failing a customer requirement", "Six sigma ~ 3.4 DPMO", "Yellow Belts support project teams"],
            practice: "List three possible defects in a process you use at work or university." },
          { id: "l2", title: "The DMAIC Cycle", minutes: 13,
            summary: "Define, Measure, Analyze, Improve, Control.",
            body: ["DMAIC is the five-phase roadmap for improving an existing process. Define: state the problem, the goal and the customer. Measure: collect baseline data about how the process performs today.",
              "Analyze: use the data to find root causes, not just symptoms. Improve: test and implement solutions that remove those causes.",
              "Control: make the improvement stick with monitoring, standard work and control charts so the process does not drift back."],
            points: ["Define - Measure - Analyze - Improve - Control", "Measure creates a baseline", "Control sustains the gain"],
            practice: "Write a one-sentence problem statement for a slow process you know." }
        ]
      },
      {
        id: "m2", title: "Basic Improvement Tools", lessons: [
          { id: "l3", title: "Process Maps and SIPOC", minutes: 12,
            summary: "Seeing the whole process before changing it.",
            body: ["A SIPOC diagram gives a high-level view of a process in five columns: Suppliers, Inputs, Process, Outputs and Customers. It is usually created in the Define phase to agree on the project scope.",
              "A process map shows the individual steps, decisions and hand-offs. Rectangles are steps, diamonds are decisions and arrows show the flow.",
              "Mapping the process as it really works, not as the manual says, often reveals waiting time, rework loops and unnecessary approvals."],
            points: ["SIPOC = Suppliers, Inputs, Process, Outputs, Customers", "Maps show steps, decisions and hand-offs", "Map the real process, not the ideal one"],
            practice: "Create a five-step SIPOC for making a cup of coffee." },
          { id: "l4", title: "Pareto Charts and Root Causes", minutes: 14,
            summary: "Focus on the vital few causes with Pareto, fishbone and 5 Whys.",
            body: ["The Pareto principle suggests that roughly 80% of problems come from 20% of causes. A Pareto chart sorts defect categories from most to least frequent so the team works on the biggest ones first.",
              "A fishbone (Ishikawa) diagram groups possible causes into categories such as Methods, Machines, Materials, People, Measurement and Environment.",
              "The 5 Whys technique asks 'why?' repeatedly until the team reaches a cause it can act on. The number five is a guide, not a rule."],
            points: ["Pareto: work on the vital few", "Fishbone organises possible causes", "5 Whys digs to an actionable cause"],
            practice: "Use the 5 Whys on a recent missed deadline." }
        ]
      }
    ],
    quiz: {
      id: "six-sigma-yellow-quiz", title: "Six Sigma Yellow Belt Check",
      questions: [
        { id: "q1", text: "About how many defects per million opportunities does a six sigma process produce?", options: ["3.4", "34", "340", "6,210"], correct: 0, explanation: "Six sigma performance corresponds to about 3.4 DPMO." },
        { id: "q2", text: "What does the 'C' in DMAIC stand for?", options: ["Check", "Create", "Control", "Customer"], correct: 2, explanation: "The last phase, Control, keeps the improved process from drifting back." },
        { id: "q3", text: "In a SIPOC diagram, what does the 'S' stand for?", options: ["Steps", "Suppliers", "Standards", "Sigma"], correct: 1, explanation: "SIPOC = Suppliers, Inputs, Process, Outputs, Customers." },
        { id: "q4", text: "What is a Pareto chart mainly used for?", options: ["Showing a process timeline", "Ranking causes so the team can focus on the most frequent ones", "Calculating the sigma level", "Assigning project roles"], correct: 1, explanation: "It sorts categories by frequency to highlight the vital few." },
        { id: "q5", text: "What is the typical role of a Yellow Belt?", options: ["Sponsoring the whole program", "Leading complex statistical projects alone", "Supporting project teams with process knowledge and data collection", "Approving company budgets"], correct: 2, explanation: "Yellow Belts support projects led by Green and Black Belts." }
      ]
    }
  },

  /* ---------------------------------------------------------- 4 */
  {
    id: "design-a-room",
    title: "How to Design a Room in 10 Easy Steps",
    category: "interior-design",
    instructor: { name: "Sofia Marchetti", role: "Interior designer (fictional profile)", bio: "Fictional instructor profile. Represents a residential designer who believes good rooms start with a tape measure, not a shopping list." },
    rating: 4.9, ratingCount: 760, studentsDemo: 7640,
    difficulty: "beginner", published: "2026-06-21", color: "mint",
    thumbnail: "assets/images/courses/room.svg",
    summary: "A practical ten-step method from measuring the space to the final styling edit.",
    description: "Designing a room does not require expensive furniture. It requires a plan. This course groups ten steps into four lessons: purpose and measurements, focal point and layout, colour and lighting, and finishing touches. You will finish with a floor plan and a shopping list for one real room.",
    objectives: ["Measure a room and draw a scaled floor plan", "Choose a focal point and arrange furniture around it", "Apply the 60-30-10 colour rule", "Layer ambient, task and accent lighting"],
    prerequisites: ["A tape measure and a room you would like to improve"],
    modules: [
      {
        id: "m1", title: "Plan the Space", lessons: [
          { id: "l1", title: "Steps 1-3: Purpose, Measurements and Floor Plan", minutes: 15,
            summary: "Decide how the room is used and measure everything.",
            body: ["Step 1: define the purpose. A living room for movie nights needs different seating than one for reading. Write down who uses the room and for what.",
              "Step 2: measure the walls, windows, doors, radiators and power outlets. Note the height of window sills and the direction doors swing.",
              "Step 3: draw a floor plan to scale, for example 1 cm = 50 cm, on grid paper or a free planning tool. Cut paper shapes for furniture so you can test layouts before moving anything heavy."],
            points: ["Purpose comes before style", "Measure openings and outlets too", "Test layouts on a scaled plan"],
            practice: "Measure one room and draw it at 1 cm = 50 cm." },
          { id: "l2", title: "Steps 4-5: Focal Point and Furniture Layout", minutes: 14,
            summary: "Anchor the room and keep clear walkways.",
            body: ["Step 4: choose a focal point, the first thing the eye should notice. It can be a window view, a fireplace, a bookcase or a large artwork.",
              "Step 5: place the largest furniture first, oriented toward the focal point. Keep main walkways about 90 cm (36 in) wide so people can move comfortably.",
              "Float furniture away from walls when the room allows it; a sofa with a console behind it often feels more inviting than one pushed against the wall."],
            points: ["One clear focal point", "Largest pieces first", "Walkways of about 90 cm"],
            practice: "Mark the focal point and main walkways on your floor plan." }
        ]
      },
      {
        id: "m2", title: "Style the Room", lessons: [
          { id: "l3", title: "Steps 6-7: Colour Palette and Lighting Layers", minutes: 16,
            summary: "The 60-30-10 rule and three layers of light.",
            body: ["Step 6: pick a palette with the 60-30-10 rule. About 60% of the room is a dominant colour (walls, large rug), 30% a secondary colour (furniture, curtains) and 10% an accent (cushions, art).",
              "Step 7: plan three layers of lighting. Ambient light gives general brightness, task light helps with activities such as reading, and accent light highlights art or texture.",
              "Warm white bulbs (around 2700-3000 K) feel cosy in living spaces, while cooler light suits work areas."],
            points: ["60% dominant, 30% secondary, 10% accent", "Ambient + task + accent lighting", "Warm white for relaxing rooms"],
            practice: "Collect three colour swatches and assign them to 60, 30 and 10." },
          { id: "l4", title: "Steps 8-10: Textiles, Art and the Final Edit", minutes: 12,
            summary: "Rugs, curtains, art height and editing out clutter.",
            body: ["Step 8: choose textiles. A living-room rug should be large enough for at least the front legs of the sofa and chairs to rest on it. Hang curtains higher and wider than the window to make it look larger.",
              "Step 9: hang art so its centre is roughly at eye level, around 145-150 cm (57-60 in) from the floor.",
              "Step 10: edit. Remove one item from every surface, step back and photograph the room; photos reveal clutter the eye ignores."],
            points: ["Front furniture legs on the rug", "Art centre at about 145-150 cm", "Edit before you add more"],
            practice: "Photograph your room, remove three items and photograph it again." }
        ]
      }
    ],
    quiz: {
      id: "design-a-room-quiz", title: "Room Design Check",
      questions: [
        { id: "q1", text: "In the 60-30-10 rule, what does the 10% represent?", options: ["The dominant wall colour", "The accent colour", "The floor area left empty", "The lighting budget"], correct: 1, explanation: "10% is the accent colour, used in small items such as cushions and art." },
        { id: "q2", text: "What are the three layers of lighting?", options: ["Bright, dim and off", "Ambient, task and accent", "Ceiling, wall and floor", "Natural, LED and halogen"], correct: 1, explanation: "Ambient (general), task (activities) and accent (highlights)." },
        { id: "q3", text: "About how wide should a main walkway be?", options: ["30 cm", "60 cm", "90 cm", "200 cm"], correct: 2, explanation: "Around 90 cm (36 in) allows comfortable movement." },
        { id: "q4", text: "What is a focal point?", options: ["The brightest bulb", "The first feature the eye is drawn to", "The centre of the floor", "The most expensive item"], correct: 1, explanation: "A focal point anchors the layout and draws attention first." },
        { id: "q5", text: "What should you do before buying furniture?", options: ["Paint every wall", "Measure the room and draw a scaled floor plan", "Buy the rug first", "Choose the art"], correct: 1, explanation: "Measurements and a plan prevent furniture that does not fit." }
      ]
    }
  },

  /* ---------------------------------------------------------- 5 */
  {
    id: "flutter-masterclass",
    title: "Flutter Masterclass: Dart, APIs, Firebase & More",
    category: "it-software",
    instructor: { name: "Aiden Park", role: "Mobile developer (fictional profile)", bio: "Fictional instructor profile. Represents a mobile developer who ships cross-platform apps and enjoys explaining state management simply." },
    rating: 4.7, ratingCount: 1890, studentsDemo: 15870,
    difficulty: "intermediate", published: "2026-08-04", color: "lavender",
    thumbnail: "assets/images/courses/flutter.svg",
    summary: "Build cross-platform apps: Dart essentials, widgets, REST APIs and Firebase.",
    description: "Flutter lets one codebase run on Android, iOS, web and desktop. You will learn the Dart features Flutter relies on, understand when to use stateless or stateful widgets, fetch data from a REST API with async/await and connect an app to Cloud Firestore.",
    objectives: ["Use Dart variables, null safety and async code", "Choose between StatelessWidget and StatefulWidget", "Fetch and decode JSON from a REST API", "Read and write Firestore documents"],
    prerequisites: ["Basic programming in any language", "Flutter SDK installed (for the practice tasks)"],
    modules: [
      {
        id: "m1", title: "Dart and Widgets", lessons: [
          { id: "l1", title: "Dart Essentials for Flutter", minutes: 17,
            summary: "Variables, final vs const, and sound null safety.",
            body: ["Dart is the language behind Flutter. Variables can be declared with var, with an explicit type such as String, or as final and const.",
              "final means the variable can be set only once, at run time. const means the value is known at compile time and is deeply immutable, which also lets Flutter reuse const widgets efficiently.",
              "Dart has sound null safety: a String can never be null, while a String? can. The compiler forces you to handle the null case before using a nullable value."],
            points: ["final = set once at run time", "const = compile-time constant", "Type? marks a nullable type"],
            code: "final now = DateTime.now();   // run-time, set once\nconst pi = 3.14159;            // compile-time\nString? nickname;              // may be null\nprint(nickname ?? 'Guest');    // fallback value",
            practice: "Declare a nullable int and print a default value when it is null." },
          { id: "l2", title: "Stateless vs Stateful Widgets", minutes: 18,
            summary: "Everything is a widget; some widgets remember things.",
            body: ["A StatelessWidget describes UI that depends only on its inputs. A title label or an icon is usually stateless.",
              "A StatefulWidget has a separate State object that can change over time, such as a counter or a form field. Calling setState() tells Flutter the state changed and the widget must rebuild.",
              "Keep state as low in the widget tree as possible. When many screens need the same data, use a state-management approach such as Provider or Riverpod."],
            points: ["Stateless = depends only on inputs", "setState() triggers a rebuild", "Keep state close to where it is used"],
            code: "class Counter extends StatefulWidget {\n  const Counter({super.key});\n  @override\n  State<Counter> createState() => _CounterState();\n}\n\nclass _CounterState extends State<Counter> {\n  int count = 0;\n  @override\n  Widget build(BuildContext context) => TextButton(\n    onPressed: () => setState(() => count++),\n    child: Text('Tapped $count times'),\n  );\n}",
            practice: "Turn the counter into a like button that toggles between two icons." }
        ]
      },
      {
        id: "m2", title: "Data and Services", lessons: [
          { id: "l3", title: "Calling REST APIs with async/await", minutes: 19,
            summary: "Futures, the http package and JSON decoding.",
            body: ["Network calls take time, so Dart returns a Future: a value that will be available later. Inside an async function you can write await to pause until the Future completes, without freezing the interface.",
              "The http package sends requests. The response body is text, which jsonDecode() turns into Dart maps and lists.",
              "In the UI, a FutureBuilder shows a loading indicator while waiting, the data when it arrives and an error message when the request fails. Always handle the error case."],
            points: ["A Future is a value that arrives later", "await works inside async functions", "Handle loading, data and error states"],
            code: "Future<List<dynamic>> loadPosts() async {\n  final res = await http.get(Uri.parse('https://example.com/posts'));\n  if (res.statusCode != 200) throw Exception('Failed');\n  return jsonDecode(res.body) as List<dynamic>;\n}",
            practice: "Show a loading spinner, then a list of titles, using FutureBuilder." },
          { id: "l4", title: "Firebase Setup and Firestore Basics", minutes: 18,
            summary: "Collections, documents and real-time streams.",
            body: ["Firebase provides hosted services such as authentication and Cloud Firestore, a NoSQL database. The FlutterFire CLI connects a Flutter project to a Firebase project and generates the configuration file.",
              "Firestore stores data as documents grouped into collections. A document is a set of key-value fields, for example a 'notes' collection with one document per note.",
              "You can read data once with get() or listen to changes with snapshots(), which returns a Stream that updates the UI in real time. Security rules on the server decide who may read or write."],
            points: ["Firestore = collections of documents", "snapshots() gives real-time updates", "Security rules protect the data"],
            code: "await FirebaseFirestore.instance\n    .collection('notes')\n    .add({'text': 'Hello', 'createdAt': FieldValue.serverTimestamp()});",
            practice: "Write the Firestore structure for a to-do app with users and tasks." }
        ]
      }
    ],
    quiz: {
      id: "flutter-masterclass-quiz", title: "Flutter Fundamentals Check",
      questions: [
        { id: "q1", text: "What does calling setState() do in a StatefulWidget?", options: ["Saves data to Firebase", "Tells Flutter the state changed so the widget rebuilds", "Deletes the widget", "Starts a network request"], correct: 1, explanation: "setState() marks the widget as needing a rebuild with the new state." },
        { id: "q2", text: "What is the difference between final and const in Dart?", options: ["There is no difference", "final is set once at run time; const is a compile-time constant", "const can be changed later", "final only works with numbers"], correct: 1, explanation: "Both prevent reassignment, but const values must be known at compile time." },
        { id: "q3", text: "What does the type String? mean?", options: ["A string that must be empty", "A string that may be null", "A list of strings", "An optional parameter"], correct: 1, explanation: "The question mark marks a nullable type under Dart's null safety." },
        { id: "q4", text: "Which keyword pauses an async function until a Future completes?", options: ["wait", "then", "await", "yield"], correct: 2, explanation: "await pauses the function (not the app) until the Future has a value." },
        { id: "q5", text: "How does Cloud Firestore organise data?", options: ["Tables with rows and columns", "Documents grouped into collections", "One large JSON file", "Spreadsheets"], correct: 1, explanation: "Firestore is a NoSQL database of documents inside collections." }
      ]
    }
  },

  /* ---------------------------------------------------------- 6 */
  {
    id: "python-fundamentals",
    title: "Python Programming Fundamentals",
    category: "it-software",
    instructor: { name: "Priya Raman", role: "Software educator (fictional profile)", bio: "Fictional instructor profile. Represents a teacher who has introduced thousands of first-year students to programming with Python." },
    rating: 4.8, ratingCount: 3420, studentsDemo: 26930,
    difficulty: "beginner", published: "2026-01-15", color: "mint",
    thumbnail: "assets/images/courses/python.svg",
    summary: "Your first programming course: variables, decisions, loops and functions in Python.",
    description: "Python is readable, popular and used everywhere from web servers to data science. Starting from zero, you will store values in variables, make decisions with if statements, repeat work with loops and organise code into functions. Every lesson ends with a short exercise you can run in any Python 3 environment.",
    objectives: ["Create variables of different types", "Write if / elif / else decisions", "Use for and while loops", "Define functions that return values"],
    prerequisites: ["None", "Python 3 or an online Python editor for the exercises"],
    modules: [
      {
        id: "m1", title: "First Steps", lessons: [
          { id: "l1", title: "Variables, Types and print()", minutes: 11,
            summary: "Store values and show them on screen.",
            body: ["A variable is a name that refers to a value. In Python you create one with the equals sign: age = 20. There is no need to declare the type first.",
              "The most common basic types are int (whole numbers), float (decimal numbers), str (text) and bool (True or False). The type() function tells you the type of any value.",
              "print() displays values. f-strings, written with an f before the quotes, insert variables into text."],
            points: ["Create variables with =", "int, float, str, bool", "f-strings format text"],
            code: "name = \"Lina\"\nage = 20\nheight = 1.68\nprint(type(height))        # <class 'float'>\nprint(f\"{name} is {age}\")   # Lina is 20",
            practice: "Store your favourite city and its population in variables and print a sentence about them." },
          { id: "l2", title: "Making Decisions with if / elif / else", minutes: 12,
            summary: "Comparison operators and conditional branches.",
            body: ["Programs make decisions with if statements. The condition after if must evaluate to True or False, often using comparison operators: ==, !=, <, >, <= and >=.",
              "elif (else if) checks another condition when the previous ones were False, and else runs when none matched. Python uses indentation, normally four spaces, to show which lines belong to each branch.",
              "Conditions can be combined with and, or and not."],
            points: ["== compares, = assigns", "Indentation defines blocks", "Combine conditions with and / or / not"],
            code: "score = 72\nif score >= 90:\n    grade = \"A\"\nelif score >= 70:\n    grade = \"B\"\nelse:\n    grade = \"C\"\nprint(grade)  # B",
            practice: "Write a program that prints 'even' or 'odd' for a number (hint: % 2)." }
        ]
      },
      {
        id: "m2", title: "Repetition and Reuse", lessons: [
          { id: "l3", title: "Loops: for and while", minutes: 13,
            summary: "Repeat code over sequences or while a condition holds.",
            body: ["A for loop repeats code for every item in a sequence, such as a list or a string. range(5) produces the numbers 0, 1, 2, 3 and 4 - it stops before 5.",
              "A while loop repeats as long as its condition is True. Make sure something inside the loop eventually makes the condition False, or the loop never ends.",
              "break leaves a loop early and continue skips to the next repetition."],
            points: ["range(5) gives 0 to 4", "while needs a changing condition", "break and continue control loops"],
            code: "for i in range(3):\n    print(i)        # 0, 1, 2\n\ncount = 3\nwhile count > 0:\n    print(count)    # 3, 2, 1\n    count -= 1",
            practice: "Print the multiplication table of 7 from 7 x 1 to 7 x 10." },
          { id: "l4", title: "Functions and Return Values", minutes: 14,
            summary: "Name a piece of logic and reuse it.",
            body: ["A function groups code under a name so you can reuse it. Define one with the def keyword, a name, parentheses with parameters and a colon.",
              "return sends a value back to the caller. A function without return gives back None.",
              "Good functions do one thing and have descriptive names, such as calculate_average instead of calc."],
            points: ["def defines a function", "return sends a result back", "One job per function"],
            code: "def average(numbers):\n    return sum(numbers) / len(numbers)\n\nprint(average([4, 8, 9]))  # 7.0\nprint(10 // 3)              # 3 (floor division)",
            practice: "Write a function that converts Celsius to Fahrenheit (F = C x 9/5 + 32)." }
        ]
      }
    ],
    quiz: {
      id: "python-fundamentals-quiz", title: "Python Basics Check",
      questions: [
        { id: "q1", text: "What does type(3.0) return?", options: ["int", "float", "str", "bool"], correct: 1, explanation: "3.0 has a decimal point, so it is a float." },
        { id: "q2", text: "Which numbers does range(5) produce?", options: ["1 to 5", "0 to 5", "0 to 4", "1 to 4"], correct: 2, explanation: "range stops BEFORE the end value: 0, 1, 2, 3, 4." },
        { id: "q3", text: "What is the result of len(\"python\")?", options: ["5", "6", "7", "An error"], correct: 1, explanation: "The word python has six characters." },
        { id: "q4", text: "Which keyword defines a function in Python?", options: ["function", "func", "def", "define"], correct: 2, explanation: "Functions start with def, e.g. def greet():" },
        { id: "q5", text: "What is the result of 10 // 3?", options: ["3", "3.33", "4", "1"], correct: 0, explanation: "// is floor division: it drops the decimal part, giving 3." }
      ]
    }
  },

  /* ---------------------------------------------------------- 7 */
  {
    id: "intro-cybersecurity",
    title: "Introduction to Cybersecurity",
    category: "cybersecurity",
    instructor: { name: "Laila Haddad", role: "Security analyst (fictional profile)", bio: "Fictional instructor profile. Represents a security operations analyst who investigates incidents and trains staff to recognise attacks." },
    rating: 4.9, ratingCount: 2760, studentsDemo: 21480,
    difficulty: "beginner", published: "2026-09-12", color: "pink",
    thumbnail: "assets/images/courses/cyber.svg",
    summary: "Core security principles, common threats and the defences that stop them.",
    description: "Every organisation needs people who understand security basics. This course explains the CIA triad, the most common attacks (malware, phishing and social engineering), how firewalls control network traffic and how strong authentication protects accounts. No technical background is required.",
    objectives: ["Explain confidentiality, integrity and availability", "Recognise phishing and social-engineering attempts", "Describe what a firewall does and how rules work", "Apply strong passwords and multi-factor authentication"],
    prerequisites: ["None"],
    modules: [
      {
        id: "m1", title: "Security Foundations", lessons: [
          { id: "l1", title: "The CIA Triad", minutes: 10,
            summary: "The three goals every security control supports.",
            body: ["Security professionals describe their goals with the CIA triad. Confidentiality means only authorised people can see information. Encryption and access controls protect it.",
              "Integrity means information is accurate and has not been changed without permission. Hashes, digital signatures and version history help detect tampering.",
              "Availability means systems and data are accessible when needed. Backups, redundant servers and protection against denial-of-service attacks support it. A good security decision balances all three."],
            points: ["Confidentiality: only authorised access", "Integrity: no unauthorised changes", "Availability: accessible when needed"],
            practice: "For your university email account, give one example of a threat to each part of the triad." },
          { id: "l2", title: "Common Threats: Malware, Phishing and Social Engineering", minutes: 14,
            summary: "How attackers trick people and infect systems.",
            body: ["Malware is malicious software. Viruses attach to files, worms spread across networks on their own, and ransomware encrypts a victim's files and demands payment for the key.",
              "Phishing is a fraudulent message that pretends to come from a trusted source to steal credentials or install malware. Warning signs include urgency, unexpected attachments, mismatched sender addresses and links whose real address differs from the text.",
              "Social engineering targets people rather than technology, for example a caller pretending to be IT support who asks for your password. Legitimate IT staff never need your password."],
            points: ["Ransomware encrypts files for payment", "Check sender, links and urgency", "Never share your password"],
            practice: "Find a spam email in your inbox and list every warning sign it shows (do not click its links)." }
        ]
      },
      {
        id: "m2", title: "Defending Systems", lessons: [
          { id: "l3", title: "Firewalls and Network Defence", minutes: 13,
            summary: "Controlling network traffic with security rules.",
            body: ["A firewall controls network traffic based on security rules. It sits between networks, such as your home network and the internet, and allows or blocks connections.",
              "Rules usually consider the source and destination address, the port and the protocol. A common approach is 'default deny': block everything, then allow only the traffic that is needed, such as HTTPS on port 443 to a web server.",
              "Firewalls are one layer of defence in depth. Others include intrusion detection systems, network segmentation and keeping software updated."],
            points: ["Firewalls allow or block traffic by rules", "Rules use addresses, ports and protocols", "Default deny + defence in depth"],
            practice: "Write two firewall rules in plain English for a small web server." },
          { id: "l4", title: "Passwords, MFA and Safe Habits", minutes: 12,
            summary: "Protecting accounts with strong authentication.",
            body: ["Long passphrases are stronger than short complex passwords. A password manager can create and remember a unique password for every site, so one leak does not expose all your accounts.",
              "Multi-factor authentication (MFA) combines factors from different categories: something you know (a password), something you have (a phone or security key) and something you are (a fingerprint).",
              "Safe habits matter as much as tools: install updates promptly, lock your screen, back up important files and report suspicious messages instead of deleting them silently."],
            points: ["Unique passphrase per site", "MFA: know / have / are", "Update, lock, back up, report"],
            practice: "Turn on MFA for one of your important accounts today." }
        ]
      }
    ],
    quiz: {
      id: "intro-cybersecurity-quiz", title: "Cybersecurity Basics Check",
      questions: [
        { id: "q1", text: "What is the primary purpose of a firewall?", options: ["To improve monitor brightness", "To control network traffic based on security rules", "To increase processor speed", "To store computer passwords"], correct: 1, explanation: "A firewall allows or blocks traffic according to its security rules." },
        { id: "q2", text: "What do the letters of the CIA triad stand for?", options: ["Control, Inspection, Access", "Confidentiality, Integrity, Availability", "Cyber, Internet, Attack", "Code, Identity, Authentication"], correct: 1, explanation: "Confidentiality, Integrity and Availability are the three security goals." },
        { id: "q3", text: "An email urgently asks you to 'verify your account' through a link with a strange address. What is this most likely?", options: ["A firewall alert", "A software update", "A phishing attempt", "A backup notification"], correct: 2, explanation: "Urgency plus a suspicious link are classic phishing signs." },
        { id: "q4", text: "Which combination is an example of multi-factor authentication?", options: ["A password and a security question", "A password and a code from your phone", "Two different passwords", "A username and a password"], correct: 1, explanation: "It combines something you know with something you have." },
        { id: "q5", text: "What does ransomware typically do?", options: ["Speeds up your computer", "Encrypts files and demands payment", "Blocks spam email", "Creates backups"], correct: 1, explanation: "Ransomware encrypts data and demands a ransom for the key." }
      ]
    }
  },

  /* ---------------------------------------------------------- 8 */
  {
    id: "web-development",
    title: "Web Development with HTML, CSS & JavaScript",
    category: "it-software",
    instructor: { name: "Tomás Rivera", role: "Front-end developer (fictional profile)", bio: "Fictional instructor profile. Represents a front-end developer who builds accessible websites and mentors career changers." },
    rating: 4.7, ratingCount: 2980, studentsDemo: 24310,
    difficulty: "beginner", published: "2026-04-08", color: "peach",
    thumbnail: "assets/images/courses/webdev.svg",
    summary: "Build your first web pages: semantic HTML, modern CSS layout and interactive JavaScript.",
    description: "The web is built on three languages. HTML gives a page its structure, CSS gives it style and layout, and JavaScript makes it interactive. In four lessons you will write a semantic page, style it with Flexbox and add a button that responds to clicks.",
    objectives: ["Write semantic HTML documents", "Explain the CSS box model and use Flexbox", "Use JavaScript variables and functions", "Change the page with the DOM and events"],
    prerequisites: ["A text editor and a web browser"],
    modules: [
      {
        id: "m1", title: "Structure and Style", lessons: [
          { id: "l1", title: "HTML Document Structure and Semantics", minutes: 12,
            summary: "Elements, attributes and meaningful tags.",
            body: ["An HTML document starts with <!DOCTYPE html>, followed by <html>, a <head> with information about the page and a <body> with the visible content.",
              "Semantic elements describe their meaning: <header>, <nav>, <main>, <article>, <section> and <footer>. They help screen readers, search engines and other developers understand the page.",
              "Use one <h1> for the main title and headings in order. Every image needs an alt attribute describing it for people who cannot see it."],
            points: ["head = information, body = content", "Use semantic elements such as <nav>", "Headings in order, alt text on images"],
            code: "<header>\n  <nav><a href=\"/\">Home</a></nav>\n</header>\n<main>\n  <h1>My first page</h1>\n  <img src=\"cat.jpg\" alt=\"A grey cat asleep on a sofa\">\n</main>",
            practice: "Create a page with a header, a nav with two links, a main section and a footer." },
          { id: "l2", title: "CSS Selectors, the Box Model and Flexbox", minutes: 16,
            summary: "Target elements, understand spacing and lay out rows.",
            body: ["CSS rules have a selector and declarations: p { color: navy; }. Class selectors start with a dot (.card) and are the most common way to style components.",
              "Every element is a box made of four layers, from inside out: content, padding, border and margin. Setting box-sizing: border-box makes width include the padding and border, which is easier to reason about.",
              "Flexbox arranges children in a row or column. Put display: flex on the parent, then use gap, justify-content and align-items to space and align the children."],
            points: ["Classes are reusable selectors", "Content - padding - border - margin", "display: flex goes on the parent"],
            code: ".cards {\n  display: flex;\n  gap: 16px;\n  justify-content: space-between;\n}\n* { box-sizing: border-box; }",
            practice: "Lay out three cards in a row with equal gaps using Flexbox." }
        ]
      },
      {
        id: "m2", title: "Interactivity", lessons: [
          { id: "l3", title: "JavaScript Variables and Functions", minutes: 14,
            summary: "let, const and reusable functions.",
            body: ["JavaScript stores values in variables declared with let (can be reassigned) or const (cannot be reassigned). Avoid the older var keyword in new code.",
              "Functions group reusable logic. You can write them with the function keyword or as arrow functions.",
              "Use the browser console (F12) to experiment: console.log() prints values and errors appear there too."],
            points: ["const cannot be reassigned", "let can be reassigned", "console.log() for testing"],
            code: "const price = 20;\nlet quantity = 2;\nquantity = 3;               // allowed\n\nfunction total(p, q) {\n  return p * q;\n}\nconsole.log(total(price, quantity)); // 60",
            practice: "Write a function that returns a greeting for a given name." },
          { id: "l4", title: "The DOM and Events", minutes: 15,
            summary: "Find elements, react to clicks and update the page.",
            body: ["The DOM (Document Object Model) is the browser's live representation of the HTML. JavaScript can find elements with document.querySelector() and change their text, classes or attributes.",
              "addEventListener() runs a function when something happens, such as a click, a key press or a form submission.",
              "For forms, call event.preventDefault() inside the submit handler when you want to handle the data with JavaScript instead of reloading the page."],
            points: ["querySelector finds elements", "addEventListener reacts to events", "preventDefault stops a form reload"],
            code: "const button = document.querySelector('#like');\nlet likes = 0;\nbutton.addEventListener('click', () => {\n  likes++;\n  button.textContent = `Likes: ${likes}`;\n});",
            practice: "Build a button that toggles a dark class on the body." }
        ]
      }
    ],
    quiz: {
      id: "web-development-quiz", title: "Web Basics Check",
      questions: [
        { id: "q1", text: "Which HTML element is the semantic choice for the main navigation links?", options: ["<div>", "<nav>", "<span>", "<menuitem>"], correct: 1, explanation: "<nav> marks a block of navigation links." },
        { id: "q2", text: "What is the order of the CSS box model from inside to outside?", options: ["Margin, border, padding, content", "Content, padding, border, margin", "Content, margin, padding, border", "Padding, content, border, margin"], correct: 1, explanation: "Content is wrapped by padding, then border, then margin." },
        { id: "q3", text: "What is true about a variable declared with const?", options: ["It can be reassigned at any time", "It cannot be reassigned", "It only stores numbers", "It is global by default"], correct: 1, explanation: "const prevents reassignment of the variable." },
        { id: "q4", text: "Which method runs a function when a button is clicked?", options: ["button.onLoad()", "button.addEventListener('click', fn)", "button.click(fn)", "document.listen(fn)"], correct: 1, explanation: "addEventListener attaches a handler for a given event type." },
        { id: "q5", text: "Where do you put display: flex to place three cards in a row?", options: ["On each card", "On the parent container of the cards", "On the <html> element only", "On the images"], correct: 1, explanation: "Flexbox is applied to the container; its children become flex items." }
      ]
    }
  },

  /* ---------------------------------------------------------- 9 */
  {
    id: "marketing-analytics",
    title: "Digital Marketing Analytics",
    category: "business",
    instructor: { name: "Hannah Brooks", role: "Analytics consultant (fictional profile)", bio: "Fictional instructor profile. Represents a consultant who builds measurement plans and GA4 reports for marketing teams." },
    rating: 4.6, ratingCount: 1150, studentsDemo: 10760,
    difficulty: "intermediate", published: "2026-07-19", color: "peach",
    thumbnail: "assets/images/courses/marketing.svg",
    summary: "Measure campaigns properly: KPIs, GA4 events, UTM tagging and key marketing ratios.",
    description: "Marketing decisions are only as good as the data behind them. This course shows how to define KPIs in a measurement plan, how GA4 collects events and parameters, how UTM tags attribute traffic to campaigns and how to calculate conversion rate, click-through rate and return on ad spend.",
    objectives: ["Write a simple measurement plan", "Explain GA4's event-based data model", "Tag campaign links with UTM parameters", "Calculate conversion rate, CTR and ROAS"],
    prerequisites: ["Basic spreadsheet skills"],
    modules: [
      {
        id: "m1", title: "Measurement Foundations", lessons: [
          { id: "l1", title: "KPIs and the Measurement Plan", minutes: 13,
            summary: "From business goals to measurable indicators.",
            body: ["A measurement plan connects business objectives to the data you will collect. It usually lists the objective, the key performance indicators (KPIs), the target, and how each KPI is measured.",
              "A KPI must be specific and tied to a decision. 'Website traffic' is a metric; 'newsletter sign-ups from organic search per month' is a KPI that tells the content team whether their work pays off.",
              "Agree on definitions before launching a campaign. If marketing and sales count 'leads' differently, their reports will never match."],
            points: ["Objective - KPI - target - data source", "A KPI supports a decision", "Agree on definitions first"],
            practice: "Write two KPIs for a student society that wants more event attendees." },
          { id: "l2", title: "How GA4 Collects Data: Events and Parameters", minutes: 17,
            summary: "Everything is an event, described by parameters.",
            body: ["Google Analytics 4 uses an event-based data model. A page view, a click, a video play and a purchase are all events. Each event can carry parameters that describe it, for example page_location or value.",
              "Some events are collected automatically, some come from enhanced measurement (such as scrolls and outbound clicks), and custom events are defined by you, often through Google Tag Manager and a dataLayer.",
              "Important events can be marked as key events (previously called conversions). Custom parameters must be registered as custom dimensions or metrics before they appear in standard reports. Never send personal data such as names or email addresses to GA4."],
            points: ["GA4 is event-based", "Parameters describe events", "Mark key events; register custom dimensions"],
            code: "dataLayer.push({\n  event: 'lesson_completed',\n  course_id: 'intro-cybersecurity',\n  lesson_id: 'l1',\n  course_progress_percent: 25\n});",
            practice: "Open your browser console on this site, complete a lesson and inspect window.dataLayer." }
        ]
      },
      {
        id: "m2", title: "Analysis", lessons: [
          { id: "l3", title: "UTM Parameters and Traffic Sources", minutes: 12,
            summary: "Tagging links so campaigns get the credit.",
            body: ["UTM parameters are tags added to a link so analytics tools know where a visit came from. The most important are utm_source (the site or platform, e.g. instagram), utm_medium (the channel type, e.g. social or email) and utm_campaign (the campaign name).",
              "Use lowercase and a shared naming convention. 'Email', 'email' and 'e-mail' would otherwise appear as three different mediums.",
              "Never put UTM tags on internal links within your own site; they start a new session attribution and distort your reports."],
            points: ["utm_source, utm_medium, utm_campaign", "Consistent lowercase naming", "No UTMs on internal links"],
            code: "https://example.com/course?utm_source=instagram&utm_medium=social&utm_campaign=autumn_launch",
            practice: "Build tagged links for one email and one Instagram post of the same campaign." },
          { id: "l4", title: "Conversion Rate, CTR and ROAS", minutes: 14,
            summary: "Three ratios every marketer calculates.",
            body: ["Conversion rate = conversions / sessions (or users) x 100. With 30 sign-ups from 1,500 sessions, the conversion rate is 2%.",
              "Click-through rate (CTR) = clicks / impressions x 100. An ad shown 10,000 times and clicked 250 times has a CTR of 2.5%.",
              "Return on ad spend (ROAS) = revenue from ads / ad spend. Spending $500 to generate $2,000 in revenue gives a ROAS of 4 (often written 4:1 or 400%). Always state which denominator you used."],
            points: ["Conversion rate = conversions / sessions", "CTR = clicks / impressions", "ROAS = revenue / ad spend"],
            practice: "Calculate CTR and ROAS for: 8,000 impressions, 160 clicks, $300 spend, $1,050 revenue." }
        ]
      }
    ],
    quiz: {
      id: "marketing-analytics-quiz", title: "Marketing Analytics Check",
      questions: [
        { id: "q1", text: "What kind of data model does Google Analytics 4 use?", options: ["Session-only", "Event-based", "Pageview-only", "Spreadsheet-based"], correct: 1, explanation: "In GA4 every interaction, including page views, is an event with parameters." },
        { id: "q2", text: "A page has 1,500 sessions and 30 sign-ups. What is the conversion rate?", options: ["0.5%", "2%", "5%", "20%"], correct: 1, explanation: "30 / 1,500 x 100 = 2%." },
        { id: "q3", text: "Which UTM parameter identifies the platform or site that sent the traffic?", options: ["utm_medium", "utm_campaign", "utm_source", "utm_content"], correct: 2, explanation: "utm_source names the referrer, e.g. instagram or newsletter." },
        { id: "q4", text: "You spend $500 on ads and they generate $2,000 revenue. What is the ROAS?", options: ["0.25", "2", "4", "1,500"], correct: 2, explanation: "ROAS = 2,000 / 500 = 4." },
        { id: "q5", text: "How is click-through rate (CTR) calculated?", options: ["Clicks / impressions x 100", "Impressions / clicks", "Revenue / clicks", "Sessions / users"], correct: 0, explanation: "CTR is the share of impressions that resulted in a click." }
      ]
    }
  },

  /* ---------------------------------------------------------- 10 */
  {
    id: "data-analytics-python",
    title: "Data Analytics with Python",
    category: "data-science",
    instructor: { name: "Kenji Watanabe", role: "Data analyst (fictional profile)", bio: "Fictional instructor profile. Represents an analyst who turns messy spreadsheets into clear dashboards with pandas." },
    rating: 4.7, ratingCount: 1640, studentsDemo: 13550,
    difficulty: "intermediate", published: "2026-03-27", color: "lavender",
    thumbnail: "assets/images/courses/dataanalytics.svg",
    summary: "Load, clean, summarise and visualise data with pandas and matplotlib.",
    description: "Analysts spend most of their time preparing data. You will load a CSV file into a pandas DataFrame, handle missing values and wrong types, summarise groups with groupby and present results in clear charts. Examples use a small sales dataset you can recreate yourself.",
    objectives: ["Load and inspect a DataFrame", "Detect and handle missing values", "Aggregate data with groupby", "Choose and create an appropriate chart"],
    prerequisites: ["Python Programming Fundamentals or equivalent", "Python with pandas and matplotlib installed"],
    modules: [
      {
        id: "m1", title: "Working with Data", lessons: [
          { id: "l1", title: "pandas DataFrames", minutes: 16,
            summary: "Rows, columns and the first look at a dataset.",
            body: ["pandas is the standard Python library for tabular data. A DataFrame is a table with labelled columns; a single column is a Series.",
              "pd.read_csv() loads a CSV file. Then df.head() shows the first five rows, df.shape returns (rows, columns), df.info() lists column types and df.describe() summarises numeric columns.",
              "Select a column with df['price'] and filter rows with a condition, for example df[df['price'] > 100]."],
            points: ["DataFrame = table, Series = column", "head(), shape, info(), describe()", "Filter with boolean conditions"],
            code: "import pandas as pd\ndf = pd.read_csv('sales.csv')\nprint(df.shape)       # (rows, columns)\nprint(df.head())      # first 5 rows\nexpensive = df[df['price'] > 100]",
            practice: "Create a DataFrame of five products with name, category and price, then filter the ones over 50." },
          { id: "l2", title: "Cleaning Data: Missing Values and Types", minutes: 18,
            summary: "Find gaps, fix types and remove duplicates.",
            body: ["Real data has gaps. df.isna().sum() counts missing values per column. You can drop rows with dropna() or fill gaps with fillna(), for example with the median.",
              "Columns are sometimes read with the wrong type: numbers stored as text or dates as strings. pd.to_numeric() and pd.to_datetime() convert them.",
              "drop_duplicates() removes repeated rows. Always record what you changed and why, so the analysis can be reproduced."],
            points: ["isna().sum() counts gaps", "fillna / dropna handle them", "Fix types with to_numeric / to_datetime"],
            code: "print(df.isna().sum())\ndf['price'] = df['price'].fillna(df['price'].median())\ndf['date'] = pd.to_datetime(df['date'])\ndf = df.drop_duplicates()",
            practice: "Add two missing prices to your DataFrame and fill them with the median." }
        ]
      },
      {
        id: "m2", title: "Insight and Presentation", lessons: [
          { id: "l3", title: "Grouping and Aggregation", minutes: 15,
            summary: "Split, apply, combine with groupby.",
            body: ["groupby splits the data into groups, applies a calculation to each and combines the results. df.groupby('category')['price'].mean() gives the average price per category.",
              "agg() calculates several statistics at once, such as count, mean and sum.",
              "The mean is sensitive to extreme values (outliers). The median, the middle value, is often a better summary for skewed data such as incomes or house prices."],
            points: ["groupby = split, apply, combine", "agg() for several statistics", "Median resists outliers"],
            code: "summary = df.groupby('category')['price'].agg(['count', 'mean', 'median'])\nprint(summary.sort_values('mean', ascending=False))",
            practice: "Find the category with the highest total sales." },
          { id: "l4", title: "Visualising with matplotlib", minutes: 16,
            summary: "Pick the right chart and label it clearly.",
            body: ["Choose the chart for the question: bar charts compare categories, line charts show change over time, histograms show distributions and scatter plots show relationships between two numbers.",
              "Every chart needs a title, axis labels with units and, if needed, a legend. Start bar-chart axes at zero so bar lengths are honest.",
              "pandas can plot directly: summary['mean'].plot(kind='bar'), then plt.show() or plt.savefig()."],
            points: ["Bar = compare, line = time, histogram = distribution", "Title, labels, units", "Bar axes start at zero"],
            code: "import matplotlib.pyplot as plt\nsummary['mean'].plot(kind='bar', title='Average price by category')\nplt.ylabel('Price (USD)')\nplt.tight_layout()\nplt.savefig('prices.png')",
            practice: "Plot monthly sales as a line chart with labelled axes." }
        ]
      }
    ],
    quiz: {
      id: "data-analytics-python-quiz", title: "pandas Essentials Check",
      questions: [
        { id: "q1", text: "How many rows does df.head() show by default?", options: ["3", "5", "10", "All rows"], correct: 1, explanation: "head() shows the first 5 rows unless you pass another number." },
        { id: "q2", text: "Which expression counts missing values in every column?", options: ["df.count()", "df.isna().sum()", "df.missing()", "df.null()"], correct: 1, explanation: "isna() marks missing values as True; sum() counts them per column." },
        { id: "q3", text: "Which method calculates the average price per category?", options: ["df.sort_values('price')", "df.groupby('category')['price'].mean()", "df['category'].unique()", "df.describe('category')"], correct: 1, explanation: "groupby splits by category and mean() averages each group." },
        { id: "q4", text: "Incomes in a dataset include a few very large values. Which summary is more robust?", options: ["Mean", "Median", "Maximum", "Sum"], correct: 1, explanation: "The median is not pulled up by extreme values the way the mean is." },
        { id: "q5", text: "What does df.shape return?", options: ["The column names", "A tuple of (rows, columns)", "The data types", "The first row"], correct: 1, explanation: "shape is a (number of rows, number of columns) tuple." }
      ]
    }
  },

  /* ---------------------------------------------------------- 11 */
  {
    id: "database-sql",
    title: "Database Design and SQL",
    category: "data-science",
    instructor: { name: "Amara Nwosu", role: "Database engineer (fictional profile)", bio: "Fictional instructor profile. Represents a database engineer who designs schemas for web applications and teaches SQL to analysts." },
    rating: 4.8, ratingCount: 2010, studentsDemo: 16920,
    difficulty: "beginner", published: "2025-12-03", color: "mint",
    thumbnail: "assets/images/courses/sql.svg",
    summary: "Design relational tables properly and query them with SELECT, JOIN and GROUP BY.",
    description: "Relational databases power most applications. You will learn how to split data into related tables with primary and foreign keys, why normalisation prevents errors, and how to answer questions with SQL queries that filter, sort, join and group data.",
    objectives: ["Identify entities, primary keys and foreign keys", "Normalise a table to third normal form", "Write SELECT queries with WHERE and ORDER BY", "Combine tables with JOIN and summarise with GROUP BY"],
    prerequisites: ["None", "Any SQL environment (SQLite works) for the exercises"],
    modules: [
      {
        id: "m1", title: "Designing Tables", lessons: [
          { id: "l1", title: "Tables, Keys and Relationships", minutes: 13,
            summary: "Entities, primary keys and foreign keys.",
            body: ["A relational database stores data in tables. Each table represents one kind of thing (an entity), such as students or courses. Rows are individual records and columns are attributes.",
              "A primary key uniquely identifies each row, for example student_id. It must be unique and never empty.",
              "A foreign key is a column that refers to the primary key of another table. An enrollments table with student_id and course_id links students to courses in a many-to-many relationship."],
            points: ["One table per entity", "Primary key = unique row identifier", "Foreign key = link to another table"],
            code: "CREATE TABLE students (\n  student_id INTEGER PRIMARY KEY,\n  first_name TEXT NOT NULL\n);\nCREATE TABLE enrollments (\n  student_id INTEGER REFERENCES students(student_id),\n  course_id  INTEGER REFERENCES courses(course_id)\n);",
            practice: "Design tables for a library with books, members and loans." },
          { id: "l2", title: "Normalisation: 1NF to 3NF", minutes: 15,
            summary: "Remove repetition to prevent update errors.",
            body: ["Normalisation organises tables to reduce duplicated data. First normal form (1NF): every cell holds a single (atomic) value - no lists like 'Math, Physics' in one cell.",
              "Second normal form (2NF): in tables with a composite key, every column depends on the whole key, not just part of it.",
              "Third normal form (3NF): non-key columns depend only on the key, not on other non-key columns. For example, a teacher's phone number belongs in a teachers table, not repeated in every course row."],
            points: ["1NF: atomic values", "2NF: depend on the whole key", "3NF: no dependencies between non-key columns"],
            practice: "Normalise a table with columns: order_id, customer_name, customer_city, products." }
        ]
      },
      {
        id: "m2", title: "Querying Data", lessons: [
          { id: "l3", title: "SELECT, WHERE and ORDER BY", minutes: 12,
            summary: "Retrieve, filter and sort rows.",
            body: ["SELECT chooses columns, FROM names the table, WHERE filters rows and ORDER BY sorts them. Text values go in single quotes.",
              "Use comparison operators (=, <>, <, >) and combine conditions with AND and OR. LIKE matches patterns: '%son' finds values ending in 'son'.",
              "LIMIT returns only the first rows, which is useful when exploring a large table."],
            points: ["SELECT ... FROM ... WHERE ... ORDER BY", "LIKE with % for patterns", "LIMIT for exploration"],
            code: "SELECT first_name, city\nFROM students\nWHERE city = 'Amman' AND year >= 2\nORDER BY first_name\nLIMIT 10;",
            practice: "List all courses with more than 3 credits, sorted by title." },
          { id: "l4", title: "JOINs and GROUP BY", minutes: 16,
            summary: "Combine tables and summarise groups.",
            body: ["An INNER JOIN returns rows that have matching values in both tables. A LEFT JOIN returns all rows from the left table, with NULLs where there is no match.",
              "GROUP BY groups rows with the same value so aggregate functions (COUNT, SUM, AVG) can summarise each group.",
              "WHERE filters rows BEFORE grouping; HAVING filters groups AFTER grouping, for example courses with more than 20 enrolments."],
            points: ["INNER JOIN = matches only", "LEFT JOIN keeps all left rows", "HAVING filters groups"],
            code: "SELECT c.title, COUNT(*) AS enrolled\nFROM enrollments e\nINNER JOIN courses c ON c.course_id = e.course_id\nGROUP BY c.title\nHAVING COUNT(*) > 20;",
            practice: "Count students per city, showing only cities with at least 5 students." }
        ]
      }
    ],
    quiz: {
      id: "database-sql-quiz", title: "SQL and Design Check",
      questions: [
        { id: "q1", text: "What is the job of a primary key?", options: ["To sort the table", "To uniquely identify each row", "To link to another database", "To encrypt the data"], correct: 1, explanation: "A primary key value is unique and identifies exactly one row." },
        { id: "q2", text: "A column in the orders table refers to customers.customer_id. What is it called?", options: ["A primary key", "An index", "A foreign key", "A view"], correct: 2, explanation: "A foreign key references the primary key of another table." },
        { id: "q3", text: "Which clause filters groups after GROUP BY?", options: ["WHERE", "ORDER BY", "HAVING", "LIMIT"], correct: 2, explanation: "HAVING filters aggregated groups; WHERE filters individual rows before grouping." },
        { id: "q4", text: "What does an INNER JOIN return?", options: ["All rows from both tables", "Only rows with matching values in both tables", "Only rows from the left table", "Rows with no matches"], correct: 1, explanation: "INNER JOIN keeps only matching pairs." },
        { id: "q5", text: "Which rule is part of first normal form (1NF)?", options: ["Every table has a foreign key", "Each cell contains a single, atomic value", "All columns are numbers", "Tables have fewer than 10 columns"], correct: 1, explanation: "1NF forbids lists or repeating groups in a single cell." }
      ]
    }
  },

  /* ---------------------------------------------------------- 12 */
  {
    id: "machine-learning",
    title: "Machine Learning Fundamentals",
    category: "data-science",
    instructor: { name: "Elena Petrova", role: "ML researcher (fictional profile)", bio: "Fictional instructor profile. Represents a researcher who explains machine learning with simple examples before any equations." },
    rating: 4.8, ratingCount: 1730, studentsDemo: 14380,
    difficulty: "advanced", published: "2026-10-05", color: "pink",
    thumbnail: "assets/images/courses/ml.svg",
    summary: "How machines learn from data: problem types, data splits, models and evaluation.",
    description: "Machine learning finds patterns in data to make predictions. This course explains the main types of learning, why data must be split into training, validation and test sets, how linear regression and classification work, and how to recognise overfitting and choose the right evaluation metric.",
    objectives: ["Distinguish supervised and unsupervised learning", "Split data correctly to avoid leakage", "Explain regression and classification models", "Detect overfitting and choose precision, recall or accuracy"],
    prerequisites: ["Data Analytics with Python or equivalent", "Comfort with basic algebra"],
    modules: [
      {
        id: "m1", title: "Core Ideas", lessons: [
          { id: "l1", title: "What Machine Learning Is", minutes: 14,
            summary: "Supervised, unsupervised and reinforcement learning.",
            body: ["In traditional programming, people write the rules. In machine learning, an algorithm learns rules (a model) from examples.",
              "Supervised learning uses labelled examples: inputs with known answers. Predicting a number, such as a house price, is regression; predicting a category, such as spam or not spam, is classification.",
              "Unsupervised learning finds structure in unlabelled data, for example k-means clustering groups customers with similar behaviour. Reinforcement learning learns by trial and error from rewards."],
            points: ["Supervised = labelled data", "Regression predicts numbers, classification predicts categories", "Clustering is unsupervised"],
            practice: "Classify five real problems as regression, classification or clustering." },
          { id: "l2", title: "Training, Validation and Test Sets", minutes: 18,
            summary: "Honest evaluation needs unseen data.",
            body: ["A model must be judged on data it has never seen. The data is usually split into a training set (to learn), a validation set (to tune settings) and a test set (for the final, unbiased evaluation).",
              "A common split is 70/15/15 or 80/10/10. The test set is used once, at the end; looking at it repeatedly turns it into another training set.",
              "Data leakage happens when information from the test set influences training, for example scaling features using statistics from the whole dataset. Leakage produces results that are too good to be true."],
            points: ["Train, validate, test", "Use the test set only once", "Avoid data leakage"],
            code: "from sklearn.model_selection import train_test_split\nX_train, X_test, y_train, y_test = train_test_split(\n    X, y, test_size=0.2, random_state=42)",
            practice: "Explain why shuffling matters before splitting a dataset sorted by date - and when you should NOT shuffle." }
        ]
      },
      {
        id: "m2", title: "Models and Evaluation", lessons: [
          { id: "l3", title: "Linear Regression and Classification", minutes: 19,
            summary: "Two foundational models and how they learn.",
            body: ["Linear regression fits a straight line (or plane) through the data, predicting y = w x + b. Training adjusts the weight w and bias b to minimise the mean squared error between predictions and real values.",
              "Logistic regression, despite its name, is a classification model. It outputs a probability between 0 and 1, and a threshold (often 0.5) turns that probability into a class.",
              "Decision trees split the data with simple yes/no questions and are easy to explain, but deep trees easily memorise the training data."],
            points: ["Linear regression minimises squared error", "Logistic regression = classification", "Deep trees can memorise"],
            code: "from sklearn.linear_model import LogisticRegression\nmodel = LogisticRegression()\nmodel.fit(X_train, y_train)\nprint(model.score(X_test, y_test))  # accuracy on unseen data",
            practice: "Describe what the weight w means in a model predicting rent from apartment size." },
          { id: "l4", title: "Overfitting and Evaluation Metrics", minutes: 18,
            summary: "Generalisation, precision, recall and accuracy.",
            body: ["Overfitting means a model performs very well on training data but poorly on new data: it has memorised noise instead of learning the pattern. Simpler models, more data, regularisation and cross-validation help.",
              "Accuracy is the share of correct predictions, but it misleads on imbalanced data: if 99% of emails are not spam, a model that never predicts spam is 99% accurate and useless.",
              "Precision = true positives / predicted positives (how many flagged items were right). Recall = true positives / actual positives (how many real cases were found). Choose the metric that matches the cost of mistakes."],
            points: ["Overfitting = great on training, poor on new data", "Accuracy misleads on imbalanced data", "Precision vs recall trade-off"],
            practice: "For a disease screening test, argue whether precision or recall matters more." }
        ]
      }
    ],
    quiz: {
      id: "machine-learning-quiz", title: "Machine Learning Check",
      questions: [
        { id: "q1", text: "Predicting the selling price of a house is which kind of problem?", options: ["Classification", "Regression", "Clustering", "Reinforcement learning"], correct: 1, explanation: "Predicting a continuous number is regression." },
        { id: "q2", text: "What is overfitting?", options: ["The model is too simple to learn anything", "The model performs well on training data but poorly on new data", "The dataset is too large", "The model trains too slowly"], correct: 1, explanation: "An overfitted model memorises training data instead of generalising." },
        { id: "q3", text: "What is the test set used for?", options: ["Training the model", "Tuning every setting repeatedly", "A final, unbiased evaluation on unseen data", "Storing labels"], correct: 2, explanation: "The test set estimates performance on new data and should be used once." },
        { id: "q4", text: "Which method is an example of unsupervised learning?", options: ["Linear regression", "Logistic regression", "k-means clustering", "A spam classifier trained on labelled emails"], correct: 2, explanation: "k-means groups unlabelled data, so it is unsupervised." },
        { id: "q5", text: "What does precision measure?", options: ["Correct predictions / all predictions", "True positives / predicted positives", "True positives / actual positives", "Training time per sample"], correct: 1, explanation: "Precision is the share of positive predictions that were correct." }
      ]
    }
  }
];
