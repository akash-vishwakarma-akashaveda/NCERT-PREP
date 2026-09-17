import { Video } from '../types';

// Demo catalogue: every NCERT subject for Classes 1–12, one revision lesson per chapter.
// Chapter numbers follow the textbook order, so IDs line up with the hand-written seed lessons.
// YouTube IDs are placeholders; real IDs arrive through the Google Sheet sync.

interface SeedSubject {
  subject: string;
  textbook: string;
  prefix: string;
  chapters: string[];
}

const s = (subject: string, textbook: string, prefix: string, chapters: string[]): SeedSubject => ({
  subject,
  textbook,
  prefix,
  chapters,
});

const SYLLABUS: Record<string, SeedSubject[]> = {
  '01': [
    s('Mathematics', 'Math-Magic 1', 'M', ['Shapes and Space', 'Numbers from One to Nine', 'Addition', 'Subtraction', 'Numbers from Ten to Twenty', 'Time', 'Measurement', 'Numbers from Twenty-one to Fifty', 'Data Handling', 'Patterns', 'Numbers', 'Money', 'How Many']),
    s('English', 'Marigold 1', 'E', ['A Happy Child', 'Three Little Pigs', 'After a Bath', 'The Bubble, the Straw and the Shoe', 'One Little Kitten', 'Lalu and Peelu', 'Once I Saw a Little Bird', 'Mittu and the Yellow Mango', 'Merry-Go-Round', 'Circle', 'Our Tree', 'A Kite', 'Sundari', 'A Little Turtle', 'The Tiger and the Mosquito']),
    s('Hindi', 'Rimjhim 1', 'H', ['झूला', 'आम की कहानी', 'आम की टोकरी', 'पत्ते ही पत्ते', 'पकौड़ी', 'छुक-छुक गाड़ी', 'रसोईघर', 'चूहो! म्याऊँ सो रही है', 'बंदर और गिलहरी', 'पगड़ी', 'पतंग', 'गेंद-बल्ला', 'बंदर गया खेत में भाग', 'एक बुढ़िया', 'लालू और पीलू', 'चकई के चकदुम', 'छोटी का कमाल', 'चार चने', 'भगदड़', 'हलीम चला चाँद पर', 'हाथी चल्लम चल्लम', 'सात पूँछ का चूहा']),
  ],
  '02': [
    s('Mathematics', 'Math-Magic 2', 'M', ['What is Long, What is Round?', 'Counting in Groups', 'How Much Can You Carry?', 'Counting in Tens', 'Patterns', 'Footprints', 'Jugs and Mugs', 'Tens and Ones', 'My Funday', 'Add our Points', 'Lines and Lines', 'Give and Take', 'The Longest Step', 'Birds Come, Birds Go', 'How Many Ponytails?']),
    s('English', 'Marigold 2', 'E', ['First Day at School', "Haldi's Adventure", 'I am Lucky!', 'I Want', 'A Smile', 'The Wind and the Sun', 'Rain', 'Storm in the Garden', 'Zoo Manners', 'Funny Bunny', 'Mr. Nobody', 'Curlylocks and the Three Bears', 'On My Blackboard I can Draw', 'Make it Shorter', 'I am the Music Man', 'The Mumbai Musicians', 'Granny Granny Please Comb my Hair', 'The Magic Porridge Pot', 'Strange Talk', 'The Grasshopper and the Ant']),
    s('Hindi', 'Rimjhim 2', 'H', ['ऊँट चला', 'भालू ने खेली फुटबॉल', 'म्याऊँ, म्याऊँ!!', 'अधिक बलवान कौन?', 'दोस्त की मदद', 'बहुत हुआ', 'मेरी किताब', 'तितली और कली', 'बुलबुल', 'मीठी सारंगी', 'टेसू राजा बीच बाज़ार', 'बस के नीचे बाघ', 'सूरज जल्दी आना जी', 'नटखट चूहा', 'एक्की-दोक्की']),
  ],
  '03': [
    s('Mathematics', 'Math-Magic 3', 'M', ['Where to Look From', 'Fun with Numbers', 'Give and Take', 'Long and Short', 'Shapes and Designs', 'Fun with Give and Take', 'Time Goes On', 'Who is Heavier?', 'How Many Times?', 'Play with Patterns', 'Jugs and Mugs', 'Can We Share?', 'Smart Charts', 'Rupees and Paise']),
    s('Environmental Studies', 'Looking Around 3', 'EVS', ["Poonam's Day Out", 'The Plant Fairy', "Water O' Water!", 'Our First School', "Chhotu's House", 'Foods We Eat', 'Saying without Speaking', 'Flying High', "It's Raining", 'What is Cooking', 'From Here to There', 'Work We Do', 'Sharing Our Feelings', 'The Story of Food', 'Making Pots', 'Games We Play', 'Here Comes a Letter', 'A House Like This', 'Our Friends – Animals', 'Drop by Drop', 'Families can be Different', 'Left-Right', 'A Beautiful Cloth', 'Web of Life']),
    s('English', 'Marigold 3', 'E', ['Good Morning', 'The Magic Garden', 'Bird Talk', 'Nina and the Baby Sparrows', 'Little by Little', 'The Enormous Turnip', 'Sea Song', 'A Little Fish Story', 'The Balloon Man', 'The Yellow Butterfly', 'Trains', 'The Story of the Road', 'Puppy and I', 'Little Tiger, Big Tiger', "What's in the Mailbox?", 'My Silly Sister', "Don't Tell", 'He is My Brother', 'How Creatures Move', 'The Ship of the Desert']),
    s('Hindi', 'Rimjhim 3', 'H', ['कक्कू', 'शेखीबाज़ मक्खी', 'चाँद वाली अम्मा', 'मन करता है', 'बहादुर बित्तो', 'हमसे सब कहते', 'टिपटिपवा', 'बंदर बाँट', 'अक्ल बड़ी या भैंस', 'क्योंजीमल और कैसे-कैसलिया', 'मीरा बहन और बाघ', 'जब मुझको साँप ने काटा', 'मिर्च का मज़ा', 'सबसे अच्छा पेड़']),
  ],
  '04': [
    s('Mathematics', 'Math-Magic 4', 'M', ['Building with Bricks', 'Long and Short', 'A Trip to Bhopal', 'Tick-Tick-Tick', 'The Way The World Looks', 'The Junk Seller', 'Jugs and Mugs', 'Carts and Wheels', 'Halves and Quarters', 'Play with Patterns', 'Tables and Shares', 'How Heavy? How Light?', 'Fields and Fences', 'Smart Charts']),
    s('Environmental Studies', 'Looking Around 4', 'EVS', ['Going to School', 'Ear to Ear', 'A Day with Nandu', 'The Story of Amrita', 'Anita and the Honeybees', "Omana's Journey", 'From the Window', "Reaching Grandmother's House", 'Changing Families', 'Hu Tu Tu, Hu Tu Tu', 'The Valley of Flowers', 'Changing Times', "A River's Tale", "Basva's Farm", 'From Market to Home', 'A Busy Month', 'Nandita in Mumbai', 'Too Much Water, Too Little Water', 'Abdul in the Garden', 'Eating Together', 'Food and Fun', 'The World in my Home', 'Pochampalli', 'Home and Abroad', 'Spicy Riddles', 'Defence Officer: Wahida', 'Chuskit Goes to School']),
    s('English', 'Marigold 4', 'E', ['Wake Up!', "Neha's Alarm Clock", 'Noses', 'The Little Fir Tree', 'Run!', "Nasruddin's Aim", 'Why?', 'Alice in Wonderland', "Don't be Afraid of the Dark", 'Helen Keller', 'The Donkey', 'I had a Little Pony', "The Milkman's Cow", 'Hiawatha', "The Scholar's Mother Tongue", 'A Watering Rhyme', 'The Giving Tree', 'Books', 'Going to Buy a Book', 'The Naughty Boy', 'Pinocchio']),
    s('Hindi', 'Rimjhim 4', 'H', ['मन के भोले-भाले बादल', 'जैसा सवाल वैसा जवाब', 'किरमिच की गेंद', 'पापा जब बच्चे थे', 'दोस्त की पोशाक', 'नाव बनाओ नाव बनाओ', 'दान का हिसाब', 'कौन?', 'स्वतंत्रता की ओर', 'थप्प रोटी थप्प दाल', 'पढ़क्कू की सूझ', 'सुनीता की पहिया कुर्सी', 'हुदहुद', 'मुफ़्त ही मुफ़्त']),
  ],
  '05': [
    s('Mathematics', 'Math-Magic 5', 'M', ['The Fish Tale', 'Shapes and Angles', 'How Many Squares?', 'Parts and Wholes', 'Does it Look the Same?', "Be My Multiple, I'll be Your Factor", 'Can You See the Pattern?', 'Mapping Your Way', 'Boxes and Sketches', 'Tenths and Hundredths', 'Area and its Boundary', 'Smart Charts', 'Ways to Multiply and Divide', 'How Big? How Heavy?']),
    s('Environmental Studies', 'Looking Around 5', 'EVS', ['Super Senses', "A Snake Charmer's Story", 'From Tasting to Digesting', 'Mangoes Round the Year', 'Seeds and Seeds', 'Every Drop Counts', 'Experiments with Water', 'A Treat for Mosquitoes', 'Up You Go!', 'Walls Tell Stories', 'Sunita in Space', 'What if it Finishes...?', 'A Shelter so High!', 'When the Earth Shook!', 'Blow Hot, Blow Cold', 'Who will do this Work?', 'Across the Wall', 'No Place for Us?', "A Seed tells a Farmer's Story", 'Whose Forests?', 'Like Father, Like Daughter', 'On the Move Again']),
    s('English', 'Marigold 5', 'E', ['Ice-cream Man', 'Wonderful Waste!', 'Teamwork', 'Flying Together', 'My Shadow', 'Robinson Crusoe Discovers a Footprint', 'Crying', 'My Elder Brother', 'The Lazy Frog', 'Rip Van Winkle', 'Class Discussion', 'The Talkative Barber', 'Topsy-turvy Land', "Gulliver's Travels", "Nobody's Friend", 'The Little Bully', 'Sing a Song of People', 'Around the World', 'Malu Bhalu', 'Who Will be Ningthou?']),
    s('Hindi', 'Rimjhim 5', 'H', ['राख की रस्सी', 'फसलों के त्योहार', 'खिलौनेवाला', 'नन्हा फनकार', 'जहाँ चाह वहाँ राह', 'चिट्ठी का सफ़र', 'डाकिए की कहानी, कँवरसिंह की ज़ुबानी', 'वे दिन भी क्या दिन थे', 'एक माँ की बेबसी', 'एक दिन की बादशाहत', 'चावल की रोटियाँ', 'गुरु और चेला', 'स्वामी की दादी', 'बाघ आया उस रात', 'बिशन की दिलेरी', 'पानी रे पानी', 'छोटी-सी हमारी नदी', 'चुनौती हिमालय की']),
  ],
  '06': [
    s('Mathematics', 'NCERT Mathematics (Class VI)', 'M', ['Knowing Our Numbers', 'Whole Numbers', 'Playing with Numbers', 'Basic Geometrical Ideas', 'Understanding Elementary Shapes', 'Integers', 'Fractions', 'Decimals', 'Data Handling', 'Mensuration', 'Algebra', 'Ratio and Proportion']),
    s('Science', 'NCERT Science (Class VI)', 'CH', ['Components of Food', 'Sorting Materials into Groups', 'Separation of Substances', 'Getting to Know Plants', 'Body Movements', 'The Living Organisms – Characteristics and Habitats', 'Motion and Measurement of Distances', 'Light, Shadows and Reflections', 'Electricity and Circuits', 'Fun with Magnets', 'Air Around Us']),
    s('Social Science', 'Our Pasts I, The Earth Our Habitat, Social and Political Life I', 'SS', ['What, Where, How and When?', 'From Hunting–Gathering to Growing Food', 'In the Earliest Cities', 'Kingdoms, Kings and an Early Republic', 'New Questions and Ideas', 'Ashoka, The Emperor Who Gave Up War', 'Vital Villages, Thriving Towns', 'Traders, Kings and Pilgrims', 'New Empires and Kingdoms', 'Buildings, Paintings and Books', 'The Earth in the Solar System', 'Globe: Latitudes and Longitudes', 'Motions of the Earth', 'Maps', 'Major Domains of the Earth', 'Major Landforms of the Earth', 'Our Country – India', 'Understanding Diversity', 'Diversity and Discrimination', 'What is Government?', 'Panchayati Raj', 'Rural Administration', 'Urban Administration', 'Rural Livelihoods', 'Urban Livelihoods']),
    s('English', 'Honeysuckle', 'E', ["Who Did Patrick's Homework?", 'How the Dog Found Himself a New Master!', "Taro's Reward", 'An Indian – American Woman in Space: Kalpana Chawla', 'A Different Kind of School', 'Who I Am', 'Fair Play', 'A Game of Chance', 'Desert Animals', 'The Banyan Tree']),
    s('Hindi', 'Vasant 1', 'H', ['वह चिड़िया जो', 'बचपन', 'नादान दोस्त', 'चाँद से थोड़ी-सी गप्पें', 'साथी हाथ बढ़ाना', 'ऐसे-ऐसे', 'टिकट एलबम', 'झाँसी की रानी', 'जो देखकर भी नहीं देखते', 'बाज और साँप', 'पानी की कहानी']),
    s('Sanskrit', 'Ruchira 1', 'SK', ['शब्दपरिचयः I', 'शब्दपरिचयः II', 'शब्दपरिचयः III', 'विद्यालयः', 'वृक्षाः', 'समुद्रतटः', 'बकस्य प्रतीकारः', 'सूक्तिस्तबकः', 'क्रीडास्पर्धा', 'कृषिकाः कर्मवीराः']),
  ],
  '07': [
    s('Mathematics', 'NCERT Mathematics (Class VII)', 'M', ['Integers', 'Fractions and Decimals', 'Data Handling', 'Simple Equations', 'Lines and Angles', 'The Triangle and its Properties', 'Comparing Quantities', 'Rational Numbers', 'Perimeter and Area', 'Algebraic Expressions', 'Exponents and Powers', 'Symmetry', 'Visualising Solid Shapes']),
    s('Science', 'NCERT Science (Class VII)', 'CH', ['Nutrition in Plants', 'Nutrition in Animals', 'Heat', 'Acids, Bases and Salts', 'Physical and Chemical Changes', 'Respiration in Organisms', 'Transportation in Animals and Plants', 'Reproduction in Plants', 'Motion and Time', 'Electric Current and its Effects', 'Light', 'Forests: Our Lifeline', 'Wastewater Story']),
    s('Social Science', 'Our Pasts II, Our Environment, Social and Political Life II', 'SS', ['Tracing Changes Through a Thousand Years', 'New Kings and Kingdoms', 'The Delhi Sultans', 'The Mughal Empire', 'Tribes, Nomads and Settled Communities', 'Devotional Paths to the Divine', 'Environment', 'Inside Our Earth', 'Our Changing Earth', 'Air', 'Water', 'Human Environment Interactions – The Tropical and the Subtropical Region', 'On Equality', 'How the State Government Works', 'Growing up as Boys and Girls', 'Women Change the World', 'Understanding Media', 'Markets Around Us']),
    s('English', 'Honeycomb', 'E', ['Three Questions', 'A Gift of Chappals', 'Gopal and the Hilsa Fish', 'The Ashes That Made Trees Bloom', 'Quality', 'Expert Detectives', 'The Invention of Vita-Wonk', 'Fire: Friend and Foe', 'A Bicycle in Good Repair', 'The Story of Cricket']),
    s('Hindi', 'Vasant 2', 'H', ['हम पंछी उन्मुक्त गगन के', 'हिमालय की बेटियाँ', 'कठपुतली', 'मीठाईवाला', 'पापा खो गए', 'शाम – एक किसान', 'अपूर्व अनुभव', 'रहीम के दोहे', 'एक तिनका', 'खानपान की बदलती तस्वीर', 'नीलकंठ', 'भोर और बरखा', 'वीर कुँवर सिंह', 'संघर्ष के कारण मैं तुनुकमिज़ाज हो गया: धनराज', 'आश्रम का अनुमानित व्यय']),
    s('Sanskrit', 'Ruchira 2', 'SK', ['सुभाषितानि', 'दुर्बुद्धिः विनश्यति', 'स्वावलम्बनम्', 'पण्डिता रमाबाई', 'सदाचारः', 'सङ्कल्पः सिद्धिदायकः', 'त्रिवर्णः ध्वजः', 'अहमपि विद्यालयं गमिष्यामि', 'विश्वबन्धुत्वम्', 'समवायो हि दुर्जयः']),
  ],
  '08': [
    s('Mathematics', 'NCERT Mathematics (Class VIII)', 'M', ['Rational Numbers', 'Linear Equations in One Variable', 'Understanding Quadrilaterals', 'Data Handling', 'Squares and Square Roots', 'Cubes and Cube Roots', 'Comparing Quantities', 'Algebraic Expressions and Identities', 'Mensuration', 'Exponents and Powers', 'Direct and Inverse Proportions', 'Factorisation', 'Introduction to Graphs']),
    s('Science', 'NCERT Science (Class VIII)', 'CH', ['Crop Production and Management', 'Microorganisms: Friend and Foe', 'Coal and Petroleum', 'Combustion and Flame', 'Conservation of Plants and Animals', 'Reproduction in Animals', 'Reaching the Age of Adolescence', 'Force and Pressure', 'Friction', 'Sound', 'Chemical Effects of Electric Current', 'Some Natural Phenomena', 'Light']),
    s('Social Science', 'Our Pasts III, Resources and Development, Social and Political Life III', 'SS', ['How, When and Where', 'From Trade to Territory', 'Ruling the Countryside', 'Tribals, Dikus and the Vision of a Golden Age', 'When People Rebel', 'Weavers, Iron Smelters and Factory Owners', 'Civilising the "Native", Educating the Nation', 'Women, Caste and Reform', 'The Making of the National Movement: 1870s–1947', 'Resources', 'Land, Soil, Water, Natural Vegetation and Wildlife Resources', 'Agriculture', 'Industries', 'Human Resources', 'The Indian Constitution', 'Understanding Secularism', 'Parliament and the Making of Laws', 'Judiciary', 'Understanding Marginalisation', 'Public Facilities', 'Law and Social Justice']),
    s('English', 'Honeydew', 'E', ['The Best Christmas Present in the World', 'The Tsunami', 'Glimpses of the Past', "Bepin Choudhury's Lapse of Memory", 'The Summit Within', "This is Jody's Fawn", 'A Visit to Cambridge', 'A Short Monsoon Diary']),
    s('Hindi', 'Vasant 3', 'H', ['लाख की चूड़ियाँ', 'बस की यात्रा', 'दीवानों की हस्ती', 'भगवान के डाकिए', 'क्या निराश हुआ जाए', 'यह सबसे कठिन समय नहीं', 'कबीर की साखियाँ', 'सुदामा चरित', 'जहाँ पहिया है', 'अकबरी लोटा', 'सूर के पद', 'पानी की कहानी', 'बाज और साँप', 'टोपी']),
    s('Sanskrit', 'Ruchira 3', 'SK', ['सुभाषितानि', 'बिलस्य वाणी न कदापि मे श्रुता', 'डिजीभारतम्', 'सदैव पुरतो निधेहि चरणम्', 'कण्टकेनैव कण्टकम्', 'गृहं शून्यं सुतां विना', 'भारतजनताऽहम्', 'संसारसागरस्य नायकाः', 'सप्तभगिन्यः', 'अशोकवनिका']),
  ],
  '09': [
    s('Mathematics', 'NCERT Mathematics (Class IX)', 'M', ['Number Systems', 'Polynomials', 'Coordinate Geometry', 'Linear Equations in Two Variables', "Introduction to Euclid's Geometry", 'Lines and Angles', 'Triangles', 'Quadrilaterals', 'Circles', "Heron's Formula", 'Surface Areas and Volumes', 'Statistics']),
    s('Science', 'NCERT Science (Class IX)', 'CH', ['Matter in Our Surroundings', 'Is Matter Around Us Pure', 'Atoms and Molecules', 'Structure of the Atom', 'The Fundamental Unit of Life', 'Tissues', 'Motion', 'Force and Laws of Motion', 'Gravitation', 'Work and Energy', 'Sound', 'Improvement in Food Resources']),
    s('Social Science', 'India and the Contemporary World I, Contemporary India I, Democratic Politics I, Economics', 'SS', ['The French Revolution', 'Socialism in Europe and the Russian Revolution', 'Nazism and the Rise of Hitler', 'Forest Society and Colonialism', 'Pastoralists in the Modern World', 'India – Size and Location', 'Physical Features of India', 'Drainage', 'Climate', 'Natural Vegetation and Wildlife', 'Population', 'What is Democracy? Why Democracy?', 'Constitutional Design', 'Electoral Politics', 'Working of Institutions', 'Democratic Rights', 'The Story of Village Palampur', 'People as Resource', 'Poverty as a Challenge', 'Food Security in India']),
    s('English', 'Beehive', 'E', ['The Fun They Had', 'The Sound of Music', 'The Little Girl', 'A Truly Beautiful Mind', 'The Snake and the Mirror', 'My Childhood', 'Reach for the Top', 'Kathmandu', 'If I Were You']),
    s('Hindi', 'Kshitij 1', 'H', ['दो बैलों की कथा', 'ल्हासा की ओर', 'उपभोक्तावाद की संस्कृति', 'साँवले सपनों की याद', 'प्रेमचंद के फटे जूते', 'मेरे बचपन के दिन', 'साखियाँ एवं सबद', 'वाख', 'सवैये', 'कैदी और कोकिला', 'ग्राम श्री', 'मेघ आए', 'बच्चे काम पर जा रहे हैं']),
    s('Sanskrit', 'Shemushi 1', 'SK', ['भारतीवसन्तगीतिः', 'स्वर्णकाकः', 'गोदोहनम्', 'सूक्तिमौक्तिकम्', 'भ्रान्तो बालः', 'लौहतुला', 'सिकतासेतुः', 'जटायोः शौर्यम्', 'पर्यावरणम्', 'वाङ्मनःप्राणस्वरूपम्']),
  ],
  '10': [
    s('Mathematics', 'NCERT Mathematics (Class X)', 'M', ['Real Numbers', 'Polynomials', 'Pair of Linear Equations in Two Variables', 'Quadratic Equations', 'Arithmetic Progressions', 'Triangles', 'Coordinate Geometry', 'Introduction to Trigonometry', 'Some Applications of Trigonometry', 'Circles', 'Areas Related to Circles', 'Surface Areas and Volumes', 'Statistics', 'Probability']),
    s('Science', 'NCERT Science (Class X)', 'CH', ['Chemical Reactions and Equations', 'Acids, Bases and Salts', 'Metals and Non-metals', 'Carbon and its Compounds', 'Life Processes', 'Control and Coordination', 'How do Organisms Reproduce?', 'Heredity', 'Light – Reflection and Refraction', 'The Human Eye and the Colourful World', 'Electricity', 'Magnetic Effects of Electric Current', 'Our Environment']),
    s('Social Science', 'India and the Contemporary World II, Contemporary India II, Democratic Politics II, Understanding Economic Development', 'SS', ['The Rise of Nationalism in Europe', 'Nationalism in India', 'The Making of a Global World', 'The Age of Industrialisation', 'Print Culture and the Modern World', 'Resources and Development', 'Forest and Wildlife Resources', 'Water Resources', 'Agriculture', 'Minerals and Energy Resources', 'Manufacturing Industries', 'Lifelines of National Economy', 'Power Sharing', 'Federalism', 'Gender, Religion and Caste', 'Political Parties', 'Outcomes of Democracy', 'Development', 'Sectors of the Indian Economy', 'Money and Credit', 'Globalisation and the Indian Economy', 'Consumer Rights']),
    s('English', 'First Flight', 'E', ['A Letter to God', 'Nelson Mandela: Long Walk to Freedom', 'Two Stories about Flying', 'From the Diary of Anne Frank', 'Glimpses of India', 'Mijbil the Otter', 'Madam Rides the Bus', 'The Sermon at Benares', 'The Proposal']),
    s('Hindi', 'Kshitij 2', 'H', ['सूरदास के पद', 'राम-लक्ष्मण-परशुराम संवाद', 'आत्मकथ्य', 'उत्साह और अट नहीं रही', 'यह दंतुरहित मुस्कान और फसल', 'छाया मत छूना', 'कन्यादान', 'संगतकार', 'नेताजी का चश्मा', 'बालगोबिन भगत', 'लखनवी अंदाज़', 'एक कहानी यह भी', 'नौबतखाने में इबादत', 'संस्कृति']),
    s('Sanskrit', 'Shemushi 2', 'SK', ['शुचिपर्यावरणम्', 'बुद्धिर्बलवती सदा', 'शिशुलालनम्', 'जननी तुल्यवत्सला', 'सुभाषितानि', 'सौहार्दं प्रकृतेः शोभा', 'विचित्रः साक्षी', 'सूक्तयः', 'भूकम्पविभीषिका', 'अन्योक्तयः']),
  ],
  '11': [
    s('Physics', 'NCERT Physics Part I & II (Class XI)', 'P', ['Units and Measurements', 'Motion in a Straight Line', 'Motion in a Plane', 'Laws of Motion', 'Work, Energy and Power', 'System of Particles and Rotational Motion', 'Gravitation', 'Mechanical Properties of Solids', 'Mechanical Properties of Fluids', 'Thermal Properties of Matter', 'Thermodynamics', 'Kinetic Theory', 'Oscillations', 'Waves']),
    s('Chemistry', 'NCERT Chemistry Part I & II (Class XI)', 'C', ['Some Basic Concepts of Chemistry', 'Structure of Atom', 'Classification of Elements and Periodicity in Properties', 'Chemical Bonding and Molecular Structure', 'Thermodynamics', 'Equilibrium', 'Redox Reactions', 'Organic Chemistry – Some Basic Principles and Techniques', 'Hydrocarbons']),
    s('Mathematics', 'NCERT Mathematics (Class XI)', 'M', ['Sets', 'Relations and Functions', 'Trigonometric Functions', 'Complex Numbers and Quadratic Equations', 'Linear Inequalities', 'Permutations and Combinations', 'Binomial Theorem', 'Sequences and Series', 'Straight Lines', 'Conic Sections', 'Introduction to Three Dimensional Geometry', 'Limits and Derivatives', 'Statistics', 'Probability']),
    s('Biology', 'NCERT Biology (Class XI)', 'B', ['The Living World', 'Biological Classification', 'Plant Kingdom', 'Animal Kingdom', 'Morphology of Flowering Plants', 'Anatomy of Flowering Plants', 'Structural Organisation in Animals', 'Cell: The Unit of Life', 'Biomolecules', 'Cell Cycle and Cell Division', 'Photosynthesis in Higher Plants', 'Respiration in Plants', 'Plant Growth and Development', 'Breathing and Exchange of Gases', 'Body Fluids and Circulation', 'Excretory Products and their Elimination', 'Locomotion and Movement', 'Neural Control and Coordination', 'Chemical Coordination and Integration']),
    s('Accountancy', 'Financial Accounting Part I (Class XI)', 'AC', ['Introduction to Accounting', 'Theory Base of Accounting', 'Recording of Transactions – I', 'Recording of Transactions – II', 'Bank Reconciliation Statement', 'Trial Balance and Rectification of Errors', 'Depreciation, Provisions and Reserves', 'Financial Statements – I', 'Financial Statements – II']),
    s('Business Studies', 'NCERT Business Studies (Class XI)', 'BS', ['Business, Trade and Commerce', 'Forms of Business Organisation', 'Private, Public and Global Enterprises', 'Business Services', 'Emerging Modes of Business', 'Social Responsibilities of Business and Business Ethics', 'Sources of Business Finance', 'Small Business and Entrepreneurship', 'Internal Trade', 'International Business']),
    s('Economics', 'Statistics for Economics, Indian Economic Development', 'EC', ['Introduction to Statistics for Economics', 'Collection of Data', 'Organisation of Data', 'Presentation of Data', 'Measures of Central Tendency', 'Correlation', 'Index Numbers', 'Indian Economy on the Eve of Independence', 'Indian Economy 1950–1990', 'Liberalisation, Privatisation and Globalisation: An Appraisal', 'Human Capital Formation in India', 'Rural Development', 'Employment: Growth, Informalisation and Other Issues', 'Environment and Sustainable Development', 'Comparative Development Experiences of India and its Neighbours']),
    s('History', 'Themes in World History', 'HI', ['Writing and City Life', 'An Empire Across Three Continents', 'Nomadic Empires', 'The Three Orders', 'Changing Cultural Traditions', 'Displacing Indigenous Peoples', 'Paths to Modernisation']),
    s('Geography', 'Fundamentals of Physical Geography', 'GE', ['Geography as a Discipline', 'The Origin and Evolution of the Earth', 'Interior of the Earth', 'Distribution of Oceans and Continents', 'Geomorphic Processes', 'Landforms and their Evolution', 'Composition and Structure of Atmosphere', 'Solar Radiation, Heat Balance and Temperature', 'Atmospheric Circulation and Weather Systems', 'Water in the Atmosphere', 'World Climate and Climate Change', 'Water (Oceans)', 'Movements of Ocean Water', 'Biodiversity and Conservation']),
    s('Political Science', 'Indian Constitution at Work', 'PS', ['Constitution: Why and How?', 'Rights in the Indian Constitution', 'Election and Representation', 'Executive', 'Legislature', 'Judiciary', 'Federalism', 'Local Governments', 'Constitution as a Living Document', 'The Philosophy of the Constitution']),
    s('English', 'Hornbill', 'E', ['The Portrait of a Lady', "We're Not Afraid to Die... if We Can All Be Together", 'Discovering Tut: the Saga Continues', "The Ailing Planet: the Green Movement's Role", 'The Adventure', 'Silk Road']),
    s('Hindi', 'Aroh 1', 'H', ['नमक का दारोगा', 'मियाँ नसीरुद्दीन', 'अपू के साथ ढाई साल', 'विदाई-संभाषण', 'गलता लोहा', 'रजनी', 'जामुन का पेड़', 'भारत माता', 'आत्मा का ताप', 'कबीर', 'मीरा', 'घर की याद', 'चंपा काले काले अच्छर नहीं चीन्हती', 'गज़ल', 'सबसे खतरनाक', 'आओ, मिलकर बचाएँ']),
    s('Computer Science', 'NCERT Computer Science (Class XI)', 'CS', ['Computer System', 'Encoding Schemes and Number System', 'Emerging Trends', 'Introduction to Problem Solving', 'Getting Started with Python', 'Flow of Control', 'Functions', 'Strings', 'Lists', 'Tuples and Dictionaries', 'Societal Impact']),
    s('Psychology', 'Introduction to Psychology', 'PY', ['What is Psychology?', 'Methods of Enquiry in Psychology', 'Human Development', 'Sensory, Attentional and Perceptual Processes', 'Learning', 'Human Memory', 'Thinking', 'Motivation and Emotion']),
    s('Sociology', 'Introducing Sociology, Understanding Society', 'SO', ['Sociology and Society', 'Terms, Concepts and their Use in Sociology', 'Understanding Social Institutions', 'Culture and Socialisation', 'Doing Sociology: Research Methods']),
  ],
  '12': [
    s('Physics', 'NCERT Physics Part I & II (Class XII)', 'P', ['Electric Charges and Fields', 'Electrostatic Potential and Capacitance', 'Current Electricity', 'Moving Charges and Magnetism', 'Magnetism and Matter', 'Electromagnetic Induction', 'Alternating Current', 'Electromagnetic Waves', 'Ray Optics and Optical Instruments', 'Wave Optics', 'Dual Nature of Radiation and Matter', 'Atoms', 'Nuclei', 'Semiconductor Electronics: Materials, Devices and Simple Circuits']),
    s('Chemistry', 'NCERT Chemistry Part I & II (Class XII)', 'C', ['Solutions', 'Electrochemistry', 'Chemical Kinetics', 'The d- and f-Block Elements', 'Coordination Compounds', 'Haloalkanes and Haloarenes', 'Alcohols, Phenols and Ethers', 'Aldehydes, Ketones and Carboxylic Acids', 'Amines', 'Biomolecules']),
    s('Mathematics', 'NCERT Mathematics Part I & II (Class XII)', 'M', ['Relations and Functions', 'Inverse Trigonometric Functions', 'Matrices', 'Determinants', 'Continuity and Differentiability', 'Application of Derivatives', 'Integrals', 'Application of Integrals', 'Differential Equations', 'Vector Algebra', 'Three Dimensional Geometry', 'Linear Programming', 'Probability']),
    s('Biology', 'NCERT Biology (Class XII)', 'B', ['Sexual Reproduction in Flowering Plants', 'Human Reproduction', 'Reproductive Health', 'Principles of Inheritance and Variation', 'Molecular Basis of Inheritance', 'Evolution', 'Human Health and Disease', 'Microbes in Human Welfare', 'Biotechnology: Principles and Processes', 'Biotechnology and its Applications', 'Organisms and Populations', 'Ecosystem', 'Biodiversity and Conservation']),
    s('Accountancy', 'Accountancy Part I & II (Class XII)', 'AC', ['Accounting for Not-for-Profit Organisation', 'Accounting for Partnership: Basic Concepts', 'Reconstitution of a Partnership Firm – Admission of a Partner', 'Reconstitution of a Partnership Firm – Retirement/Death of a Partner', 'Dissolution of Partnership Firm', 'Accounting for Share Capital', 'Issue and Redemption of Debentures', 'Financial Statements of a Company', 'Analysis of Financial Statements', 'Accounting Ratios', 'Cash Flow Statement']),
    s('Business Studies', 'Business Studies Part I & II (Class XII)', 'BS', ['Nature and Significance of Management', 'Principles of Management', 'Business Environment', 'Planning', 'Organising', 'Staffing', 'Directing', 'Controlling', 'Financial Management', 'Financial Markets', 'Marketing', 'Consumer Protection']),
    s('Economics', 'Introductory Microeconomics, Introductory Macroeconomics', 'EC', ['Introduction to Microeconomics', 'Theory of Consumer Behaviour', 'Production and Costs', 'The Theory of the Firm under Perfect Competition', 'Market Equilibrium', 'National Income Accounting', 'Money and Banking', 'Determination of Income and Employment', 'Government Budget and the Economy', 'Open Economy Macroeconomics']),
    s('History', 'Themes in Indian History', 'HI', ['Bricks, Beads and Bones', 'Kings, Farmers and Towns', 'Kinship, Caste and Class', 'Thinkers, Beliefs and Buildings', 'Through the Eyes of Travellers', 'Bhakti–Sufi Traditions', 'An Imperial Capital: Vijayanagara', 'Peasants, Zamindars and the State', 'Colonialism and the Countryside', 'Rebels and the Raj', 'Mahatma Gandhi and the Nationalist Movement', 'Framing the Constitution']),
    s('Geography', 'Fundamentals of Human Geography', 'GE', ['Human Geography: Nature and Scope', 'The World Population', 'Human Development', 'Primary Activities', 'Secondary Activities', 'Tertiary and Quaternary Activities', 'Transport and Communication', 'International Trade']),
    s('Political Science', 'Contemporary World Politics, Politics in India since Independence', 'PS', ['The End of Bipolarity', 'Contemporary Centres of Power', 'Contemporary South Asia', 'International Organisations', 'Security in the Contemporary World', 'Environment and Natural Resources', 'Globalisation', 'Challenges of Nation Building', 'Era of One-Party Dominance', 'Politics of Planned Development', "India's External Relations", 'Challenges to and Restoration of the Congress System', 'The Crisis of Democratic Order', 'Regional Aspirations', 'Recent Developments in Indian Politics']),
    s('English', 'Flamingo', 'E', ['The Last Lesson', 'Lost Spring', 'Deep Water', 'The Rattrap', 'Indigo', 'Poets and Pancakes', 'The Interview', 'Going Places']),
    s('Hindi', 'Aroh 2', 'H', ['आत्म-परिचय, एक गीत', 'पतंग', 'कविता के बहाने, बात सीधी थी पर', 'कैमरे में बंद अपाहिज', 'उषा', 'बादल राग', 'कवितावली, लक्ष्मण-मूर्च्छा और राम का विलाप', 'रुबाइयाँ', 'छोटा मेरा खेत', 'भक्तिन', 'बाज़ार दर्शन', 'काले मेघा पानी दे', 'पहलवान की ढोलक', 'चार्ली चैप्लिन यानी हम सब', 'नमक', 'शिरीष के फूल', 'श्रम-विभाजन और जाति-प्रथा']),
    s('Computer Science', 'NCERT Computer Science (Class XII)', 'CS', ['Exception Handling in Python', 'File Handling in Python', 'Stack', 'Queue', 'Sorting', 'Searching', 'Understanding Data', 'Database Concepts', 'Structured Query Language (SQL)', 'Computer Networks', 'Data Communication', 'Security Aspects']),
    s('Psychology', 'NCERT Psychology (Class XII)', 'PY', ['Variations in Psychological Attributes', 'Self and Personality', 'Meeting Life Challenges', 'Psychological Disorders', 'Therapeutic Approaches', 'Attitude and Social Cognition', 'Social Influence and Group Processes']),
    s('Sociology', 'Indian Society', 'SO', ['Introducing Indian Society', 'The Demographic Structure of the Indian Society', 'Social Institutions: Continuity and Change', 'The Market as a Social Institution', 'Patterns of Social Inequality and Exclusion', 'The Challenges of Cultural Diversity']),
  ],
};

const ID_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_';

// Deterministic 11-character placeholder ID so progress and favourites survive reloads.
function placeholderId(key: string): string {
  let h1 = 0x811c9dc5;
  let h2 = 0x01000193;
  for (let i = 0; i < key.length; i++) {
    h1 = Math.imul(h1 ^ key.charCodeAt(i), 16777619);
    h2 = Math.imul(h2 ^ key.charCodeAt(i), 2246822519);
  }
  let out = '';
  for (let i = 0; i < 11; i++) {
    const n = i < 6 ? h1 >>> (i * 5) : h2 >>> ((i - 6) * 5);
    out += ID_CHARS[n & 63];
  }
  return out;
}

const normalise = (text: string) => text.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '');
const LANGUAGES = new Set(['English', 'Hindi', 'Sanskrit']);

export function generateSeedVideos(existing: Video[]): Video[] {
  const taken = new Set(existing.map((v) => `${v.class_sort}|${v.subject}|${normalise(v.chapter_name)}`));
  const takenIds = new Set(existing.map((v) => `${v.class_sort}|${v.subject}|${v.chapter_id}`));
  const videos: Video[] = [];

  Object.entries(SYLLABUS).forEach(([classSort, subjects]) => {
    const classNo = parseInt(classSort, 10);
    subjects.forEach(({ subject, textbook, prefix, chapters }) => {
      chapters.forEach((chapterName, index) => {
        const chapterId = `${prefix}-${String(index + 1).padStart(2, '0')}`;
        const key = `${classSort}|${subject}|${chapterId}`;
        if (taken.has(`${classSort}|${subject}|${normalise(chapterName)}`) || takenIds.has(key)) return;
        const id = placeholderId(key);
        videos.push({
          youtube_id: id,
          class_display: `Class ${classNo}`,
          class_sort: classSort,
          subject,
          textbook,
          chapter_id: chapterId,
          chapter_name: chapterName,
          video_title: `${chapterName} | ${classNo <= 5 ? 'Explained Simply' : 'One-Shot Revision'}`,
          duration_seconds: (classNo <= 5 ? 600 : 1500) + (id.charCodeAt(0) * 37 + id.charCodeAt(5) * 11) % 1500,
          isActive: true,
          isPremium: false,
          pyq_available: (classNo === 10 || classNo === 12) && !LANGUAGES.has(subject),
        });
      });
    });
  });
  return videos;
}
