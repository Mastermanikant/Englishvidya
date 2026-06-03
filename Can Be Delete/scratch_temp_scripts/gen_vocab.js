const fs = require('fs');
const path = require('path');

const data = [
    {
        "word": "ANALYZE",
        "meaning": "To examine methodically and in detail for purposes of explanation or interpretation (replaces the conversational 'look at' or 'break down').",
        "example": "Students were asked to analyze the statistical data to find trends.",
        "category": "Analyzing & Examining"
    },
    {
        "word": "SCRUTINIZE",
        "meaning": "To examine or inspect closely and thoroughly (replaces the conversational 'look closely at').",
        "example": "Customs officials scrutinize every passport to ensure validity.",
        "category": "Analyzing & Examining"
    },
    {
        "word": "EVALUATE",
        "meaning": "To assess the value, quality, importance, or condition of something (replaces the conversational 'judge' or 'test').",
        "example": "The committee will evaluate all the proposals before selecting a winner.",
        "category": "Analyzing & Examining"
    },
    {
        "word": "ASSESS",
        "meaning": "To estimate the nature, quality, ability, or significance of something (replaces the conversational 'check out' or 'size up').",
        "example": "The teacher will assess the students' progress through a final test.",
        "category": "Analyzing & Examining"
    },
    {
        "word": "APPRAISE",
        "meaning": "To assess the value or quality of something (replaces the conversational 'judge' or 'value').",
        "example": "An expert was called in to appraise the rare manuscripts.",
        "category": "Analyzing & Examining"
    },
    {
        "word": "DISCERN",
        "meaning": "To perceive or recognize something, especially with difficulty (replaces the conversational 'see' or 'make out').",
        "example": "It was difficult to discern the differences between the two paintings.",
        "category": "Analyzing & Examining"
    },
    {
        "word": "INVESTIGATE",
        "meaning": "To carry out a systematic or formal inquiry to discover facts (replaces the conversational 'look into').",
        "example": "The police are continuing to investigate the cause of the fire.",
        "category": "Analyzing & Examining"
    },
    {
        "word": "DECONSTRUCT",
        "meaning": "To analyze a text or concept by exposing its internal contradictions (replaces the conversational 'take apart').",
        "example": "In film studies, students deconstruct movies to find hidden meanings.",
        "category": "Analyzing & Examining"
    },
    {
        "word": "CLASSIFY",
        "meaning": "To arrange a group of things in classes or categories according to shared qualities (replaces the conversational 'group' or 'sort').",
        "example": "Biologists classify organisms based on their genetic similarities.",
        "category": "Analyzing & Examining"
    },
    {
        "word": "DIFFERENTIATE",
        "meaning": "To recognize or show the difference between two or more things (replaces the conversational 'tell apart').",
        "example": "It is important to differentiate between correlation and causation.",
        "category": "Analyzing & Examining"
    },
    {
        "word": "DISTINGUISH",
        "meaning": "To perceive or point out a difference between things (replaces the conversational 'tell the difference').",
        "example": "A young child may not be able to distinguish truth from fiction.",
        "category": "Analyzing & Examining"
    },
    {
        "word": "IDENTIFY",
        "meaning": "To establish or indicate who or what someone or something is (replaces the conversational 'find' or 'point out').",
        "example": "The system helps researchers identify genetic patterns easily.",
        "category": "Analyzing & Examining"
    },
    {
        "word": "DELINEATE",
        "meaning": "To describe or portray something precisely (replaces the conversational 'draw' or 'lay out').",
        "example": "The contract should clearly delineate the responsibilities of each party.",
        "category": "Analyzing & Examining"
    },
    {
        "word": "DISCREPANCY",
        "meaning": "An illogical lack of compatibility between two or more facts (replaces the conversational 'difference' or 'clash').",
        "example": "There was a minor discrepancy between the two bank statements.",
        "category": "Analyzing & Examining"
    },
    {
        "word": "CONCEIVE",
        "meaning": "To form or devise a plan or idea in the mind (replaces the conversational 'think of' or 'come up with').",
        "example": "She was able to conceive a new way of processing recycled plastics.",
        "category": "Formulating Ideas & Concepts"
    },
    {
        "word": "FORMULATE",
        "meaning": "To express an idea or theory in a systematic and precise way (replaces the conversational 'make up' or 'put together').",
        "example": "The research team worked hard to formulate a coherent policy proposal.",
        "category": "Formulating Ideas & Concepts"
    },
    {
        "word": "HYPOTHESIZE",
        "meaning": "To put forward a tentative assumption or explanation for testing (replaces the conversational 'guess' or 'suppose').",
        "example": "Scientists hypothesize that the planet was once covered in water.",
        "category": "Formulating Ideas & Concepts"
    },
    {
        "word": "SPECULATE",
        "meaning": "To form a theory or conjecture about a subject without firm evidence (replaces the conversational 'guess' or 'wonder').",
        "example": "Economists speculate that interest rates will rise next quarter.",
        "category": "Formulating Ideas & Concepts"
    },
    {
        "word": "POSTULATE",
        "meaning": "To suggest or assume the existence, fact, or truth of something as a basis for reasoning (replaces the conversational 'put forward' or 'assume').",
        "example": "He postulated that all humans are born with a basic language acquisition device.",
        "category": "Formulating Ideas & Concepts"
    },
    {
        "word": "THEORIZE",
        "meaning": "To form a theory or theories about something (replaces the conversational 'come up with an idea').",
        "example": "Some researchers theorize that early humans used music to communicate before language.",
        "category": "Formulating Ideas & Concepts"
    },
    {
        "word": "CONCEPTUALIZE",
        "meaning": "To form a concept or idea of something (replaces the conversational 'imagine' or 'get an idea of').",
        "example": "It is hard to conceptualize the vastness of the universe.",
        "category": "Formulating Ideas & Concepts"
    },
    {
        "word": "DEVISE",
        "meaning": "To plan or invent a complex procedure or system by careful thought (replaces the conversational 'plan' or 'make up').",
        "example": "The engineers devised a system to capture rainwater efficiently.",
        "category": "Formulating Ideas & Concepts"
    },
    {
        "word": "SYNTHESIZE",
        "meaning": "To combine a number of different ideas or components into a coherent whole (replaces the conversational 'mix' or 'put together').",
        "example": "You need to synthesize the information from all three sources in your essay.",
        "category": "Formulating Ideas & Concepts"
    },
    {
        "word": "CONSOLIDATE",
        "meaning": "To combine a number of things into a single, more effective or coherent whole (replaces the conversational 'combine' or 'merge').",
        "example": "The team will consolidate their research notes into a single document.",
        "category": "Formulating Ideas & Concepts"
    },
    {
        "word": "ADVOCATE",
        "meaning": "To publicly recommend or support a particular cause or policy (replaces the conversational 'speak up for' or 'support').",
        "example": "Many environmentalists advocate for the reduction of single-use plastics.",
        "category": "Arguing & Discussing"
    },
    {
        "word": "ASSERT",
        "meaning": "To state a fact or belief confidently and forcefully (replaces the conversational 'say strongly').",
        "example": "She continued to assert her innocence despite the evidence presented.",
        "category": "Arguing & Discussing"
    },
    {
        "word": "CONCUR",
        "meaning": "To be of the same opinion or agree (replaces the conversational 'agree').",
        "example": "The board members concur that immediate action must be taken.",
        "category": "Arguing & Discussing"
    },
    {
        "word": "DISSENT",
        "meaning": "To hold or express opinions that are at variance with those previously or officially held (replaces the conversational 'disagree').",
        "example": "Two judges chose to dissent from the majority ruling.",
        "category": "Arguing & Discussing"
    },
    {
        "word": "REFUTE",
        "meaning": "To prove a statement or theory to be wrong or false (replaces the conversational 'prove wrong' or 'argue against').",
        "example": "The laboratory results refute the claims made by the manufacturer.",
        "category": "Arguing & Discussing"
    },
    {
        "word": "CONCEDE",
        "meaning": "To admit that something is true or valid after first denying or resisting it (replaces the conversational 'give in' or 'admit').",
        "example": "The candidate refused to concede the election until all votes were counted.",
        "category": "Arguing & Discussing"
    },
    {
        "word": "CHALLENGE",
        "meaning": "To dispute the truth or validity of something (replaces the conversational 'question' or 'argue with').",
        "example": "New discoveries challenge the traditional view of dinosaur extinction.",
        "category": "Arguing & Discussing"
    },
    {
        "word": "BROACH",
        "meaning": "To raise a difficult or sensitive subject for discussion (replaces the conversational 'bring up a topic').",
        "example": "It was hard for him to broach the subject of a budget deficit with his boss.",
        "category": "Arguing & Discussing"
    },
    {
        "word": "ELABORATE",
        "meaning": "To present an argument or theory in further detail (replaces the conversational 'say more' or 'go into detail').",
        "example": "Could you elaborate on the third point you made in your report?",
        "category": "Arguing & Discussing"
    },
    {
        "word": "EXPOUND",
        "meaning": "To present and explain a theory or idea systematically and in detail (replaces the conversational 'explain in detail').",
        "example": "He expounded on his theories of economic growth during the lecture.",
        "category": "Arguing & Discussing"
    },
    {
        "word": "ELUCIDATE",
        "meaning": "To make something clear or explain it thoroughly (replaces the conversational 'make clear' or 'explain').",
        "example": "The speaker used diagrams to elucidate the complex chemical process.",
        "category": "Arguing & Discussing"
    },
    {
        "word": "DELIBERATE",
        "meaning": "To engage in long and careful consideration (replaces the conversational 'think over' or 'talk over').",
        "example": "The jury will deliberate tomorrow morning to reach a verdict.",
        "category": "Arguing & Discussing"
    },
    {
        "word": "CONTEST",
        "meaning": "To oppose an action, decision, or theory as mistaken or wrong (replaces the conversational 'fight against' or 'argue about').",
        "example": "The heirs decided to contest the validity of the will in court.",
        "category": "Arguing & Discussing"
    },
    {
        "word": "RECAPITULATE",
        "meaning": "To summarize and state again the main points of something (replaces the conversational 'go over again' or 'sum up').",
        "example": "Let me recapitulate the main findings before we open the floor to questions.",
        "category": "Arguing & Discussing"
    },
    {
        "word": "PROVOKE",
        "meaning": "To stimulate or give rise to a reaction or emotion, typically a strong one (replaces the conversational 'cause' or 'stir up').",
        "example": "His controversial statements were designed to provoke a debate.",
        "category": "Arguing & Discussing"
    },
    {
        "word": "PRECIPITATE",
        "meaning": "To cause an event or situation, typically a bad one, to happen suddenly or unexpectedly (replaces the conversational 'cause' or 'bring on').",
        "example": "The sudden drop in stock prices precipitated an economic crisis.",
        "category": "Cause, Effect & Connection"
    },
    {
        "word": "FACILITATE",
        "meaning": "To make an action or process easy or easier (replaces the conversational 'make easy' or 'help happen').",
        "example": "Modern technology is designed to facilitate the rapid exchange of information.",
        "category": "Cause, Effect & Connection"
    },
    {
        "word": "IMPEDE",
        "meaning": "To delay or prevent someone or something by obstructing them (replaces the conversational 'slow down' or 'get in the way of').",
        "example": "Lack of funding will impede the progress of the scientific project.",
        "category": "Cause, Effect & Connection"
    },
    {
        "word": "CORRELATE",
        "meaning": "To have a mutual relationship or connection, in which one thing affects or depends on another (replaces the conversational 'link up' or 'go together').",
        "example": "Studies show that high stress levels correlate with poor health outcomes.",
        "category": "Cause, Effect & Connection"
    },
    {
        "word": "DERIVE",
        "meaning": "To obtain or trace something from a specified source (replaces the conversational 'come from' or 'get from').",
        "example": "Many modern medicines are derived from plants found in the rainforest.",
        "category": "Cause, Effect & Connection"
    },
    {
        "word": "MANIFEST",
        "meaning": "To show or demonstrate a quality or feeling by one's acts or appearance (replaces the conversational 'show' or 'appear').",
        "example": "The symptoms of the virus usually manifest within two weeks of exposure.",
        "category": "Cause, Effect & Connection"
    },
    {
        "word": "GENERATE",
        "meaning": "To cause something to arise or come about (replaces the conversational 'make' or 'produce').",
        "example": "The new marketing campaign helped generate a lot of public interest.",
        "category": "Cause, Effect & Connection"
    },
    {
        "word": "TRANSFORM",
        "meaning": "To make a thorough or dramatic change in the form, appearance, or character of something (replaces the conversational 'change' or 'turn into').",
        "example": "Online learning has transformed how students access higher education.",
        "category": "Cause, Effect & Connection"
    },
    {
        "word": "INHIBIT",
        "meaning": "To hinder, restrain, or prevent an action or process (replaces the conversational 'hold back' or 'stop').",
        "example": "Cold temperatures inhibit the growth of bacteria in food.",
        "category": "Cause, Effect & Connection"
    },
    {
        "word": "EXACERBATE",
        "meaning": "To make a problem, bad situation, or negative feeling worse (replaces the conversational 'make worse').",
        "example": "Adding fuel to the fire will only exacerbate the dangerous situation.",
        "category": "Cause, Effect & Connection"
    },
    {
        "word": "AMELIORATE",
        "meaning": "To make something bad or unsatisfactory better (replaces the conversational 'make better' or 'improve').",
        "example": "The new regulations were introduced to ameliorate safety standards at work.",
        "category": "Cause, Effect & Connection"
    },
    {
        "word": "CONSTITUTE",
        "meaning": "To be the parts that combine to form something (replaces the conversational 'make up' or 'form').",
        "example": "Twelve chapters constitute the entirety of the textbook.",
        "category": "Cause, Effect & Connection"
    },
    {
        "word": "INCORPORATE",
        "meaning": "To take in or include something as a part of a whole (replaces the conversational 'include' or 'put in').",
        "example": "We should incorporate the feedback we received into the final draft.",
        "category": "Cause, Effect & Connection"
    },
    {
        "word": "IMPEDIMENT",
        "meaning": "A hindrance or obstruction in doing something (replaces the conversational 'block' or 'hurdle').",
        "example": "Language barriers can be a major impediment to international business.",
        "category": "Cause, Effect & Connection"
    },
    {
        "word": "ASCERTAIN",
        "meaning": "To find out or make sure of something for certain (replaces the conversational 'find out' or 'make sure').",
        "example": "The team conducted interviews to ascertain the public's reaction to the policy.",
        "category": "Research & Verification"
    },
    {
        "word": "VERIFY",
        "meaning": "To make sure that something is true, accurate, or justified (replaces the conversational 'double check').",
        "example": "Please verify your email address before completing the registration.",
        "category": "Research & Verification"
    },
    {
        "word": "SUBSTANTIATE",
        "meaning": "To provide evidence to support or prove the truth of something (replaces the conversational 'back up with proof').",
        "example": "You must substantiate your claims with data from reliable sources.",
        "category": "Research & Verification"
    },
    {
        "word": "VALIDATE",
        "meaning": "To check or prove the accuracy or validity of something (replaces the conversational 'prove right').",
        "example": "The results of the test validate the doctor's initial theory.",
        "category": "Research & Verification"
    },
    {
        "word": "CORROBORATE",
        "meaning": "To confirm or give support to a statement, theory, or finding (replaces the conversational 'back up' or 'agree with').",
        "example": "Two independent witnesses were able to corroborate the suspect's alibi.",
        "category": "Research & Verification"
    },
    {
        "word": "REPLICATE",
        "meaning": "To copy, reproduce, or repeat an experiment to verify results (replaces the conversational 'do again' or 'copy').",
        "example": "Other scientists tried to replicate the experiment but got different results.",
        "category": "Research & Verification"
    },
    {
        "word": "DOCUMENT",
        "meaning": "To record something in written, photographic, or other form (replaces the conversational 'write down').",
        "example": "It is important to document every step of the research process.",
        "category": "Research & Verification"
    },
    {
        "word": "ACCUMULATE",
        "meaning": "To gather or acquire an increasing number or quantity of something (replaces the conversational 'gather' or 'pile up').",
        "example": "Over the years, the library has accumulated a vast collection of rare books.",
        "category": "Research & Verification"
    },
    {
        "word": "UTILIZE",
        "meaning": "To make practical and effective use of something (replaces the conversational 'use').",
        "example": "The factory has learned to utilize solar energy to power its machines.",
        "category": "Research & Verification"
    },
    {
        "word": "CORROBORATION",
        "meaning": "Evidence that confirms or supports a statement, theory, or finding (replaces the conversational 'proof' or 'backing').",
        "example": "We need corroboration from another source before we can publish the story.",
        "category": "Research & Verification"
    },
    {
        "word": "DEDUCE",
        "meaning": "To arrive at a fact or a conclusion by reasoning from general principles (replaces the conversational 'work out' or 'figure out').",
        "example": "Based on the evidence, the detective deduced that the window had been broken from the inside.",
        "category": "Logical Reasoning"
    },
    {
        "word": "INFER",
        "meaning": "To deduce or conclude information from evidence rather than from explicit statements (replaces the conversational 'guess from clues' or 'figure out').",
        "example": "From her silent reaction, we could infer that she did not agree with the plan.",
        "category": "Logical Reasoning"
    },
    {
        "word": "CONCLUDE",
        "meaning": "To arrive at a judgment or opinion by reasoning (replaces the conversational 'end' or 'wrap up').",
        "example": "We can conclude that the project was a success based on the feedback.",
        "category": "Logical Reasoning"
    },
    {
        "word": "IMPLY",
        "meaning": "To strongly suggest the truth or existence of something not expressly stated (replaces the conversational 'hint' or 'suggest').",
        "example": "His remarks imply that he is planning to resign soon.",
        "category": "Logical Reasoning"
    },
    {
        "word": "EXCLUDE",
        "meaning": "To deny someone or something access to a place, group, or privilege (replaces the conversational 'leave out').",
        "example": "The study chose to exclude participants under eighteen years of age.",
        "category": "Logical Reasoning"
    },
    {
        "word": "OMIT",
        "meaning": "To leave out or exclude someone or something, either intentionally or forgetfully (replaces the conversational 'skip' or 'leave out').",
        "example": "Please do not omit any details when describing the incident.",
        "category": "Logical Reasoning"
    },
    {
        "word": "PRESUME",
        "meaning": "To suppose that something is the case on the basis of probability (replaces the conversational 'assume' or 'guess').",
        "example": "In court, we presume that a person is innocent until proven guilty.",
        "category": "Logical Reasoning"
    },
    {
        "word": "INTEGRATE",
        "meaning": "To combine one thing with another so that they become a whole (replaces the conversational 'mix in' or 'combine').",
        "example": "The school aims to integrate technology into every classroom lesson.",
        "category": "Logical Reasoning"
    },
    {
        "word": "DEVIATE",
        "meaning": "To depart from an established course or accepted standard (replaces the conversational 'go off track' or 'turn away').",
        "example": "Do not deviate from the plan without checking with the manager.",
        "category": "Logical Reasoning"
    },
    {
        "word": "CONVERGE",
        "meaning": "To come together from different directions so as eventually to meet (replaces the conversational 'come together').",
        "example": "Many different opinions began to converge on a single solution.",
        "category": "Logical Reasoning"
    },
    {
        "word": "DIVERGE",
        "meaning": "To separate and go in different directions from the same point (replaces the conversational 'split' or 'go separate ways').",
        "example": "The career paths of the two brothers began to diverge after university.",
        "category": "Logical Reasoning"
    },
    {
        "word": "RATIONALE",
        "meaning": "A set of reasons or a logical basis for a course of action or a belief (replaces the conversational 'reason' or 'thinking').",
        "example": "The professor explained the rationale behind the grading criteria.",
        "category": "Logical Reasoning"
    },
    {
        "word": "IMPLICATION",
        "meaning": "The conclusion that can be drawn from something although it is not explicitly stated (replaces the conversational 'logical result' or 'hinted outcome').",
        "example": "We need to consider the economic implications of this new policy.",
        "category": "Logical Reasoning"
    },
    {
        "word": "SUBSTANTIAL",
        "meaning": "Of considerable importance, size, or worth (replaces the conversational 'big' or 'a lot').",
        "example": "The new research project received a substantial amount of funding.",
        "category": "Academic Adjectives & Adverbs"
    },
    {
        "word": "MINIMAL",
        "meaning": "Of a minimum amount, quantity, or degree (replaces the conversational 'tiny' or 'very little').",
        "example": "The damage to the building was minimal and easily repaired.",
        "category": "Academic Adjectives & Adverbs"
    },
    {
        "word": "MARGINAL",
        "meaning": "Minor or not important; barely enough to be noticed (replaces the conversational 'small' or 'barely there').",
        "example": "There was only a marginal improvement in the student's grades.",
        "category": "Academic Adjectives & Adverbs"
    },
    {
        "word": "PREDOMINANTLY",
        "meaning": "Mainly; for the most part (replaces the conversational 'mostly' or 'mainly').",
        "example": "The student population is predominantly from the local region.",
        "category": "Academic Adjectives & Adverbs"
    },
    {
        "word": "CONSEQUENTLY",
        "meaning": "As a result (replaces the conversational 'so' or 'as a result').",
        "example": "He missed the bus; consequently, he was late for the exam.",
        "category": "Academic Adjectives & Adverbs"
    },
    {
        "word": "NEVERTHELESS",
        "meaning": "In spite of that; notwithstanding; all the same (replaces the conversational 'but' or 'anyway').",
        "example": "The math test was extremely difficult; nevertheless, she managed to pass.",
        "category": "Academic Adjectives & Adverbs"
    },
    {
        "word": "FURTHERMORE",
        "meaning": "In addition; besides (replaces the conversational 'also' or 'besides').",
        "example": "The laptop is lightweight; furthermore, it has a very long battery life.",
        "category": "Academic Adjectives & Adverbs"
    },
    {
        "word": "SUFFICIENT",
        "meaning": "Enough; adequate for a particular purpose (replaces the conversational 'enough').",
        "example": "Make sure you have sufficient time to complete the assignment.",
        "category": "Academic Adjectives & Adverbs"
    },
    {
        "word": "ADEQUATE",
        "meaning": "Satisfactory or acceptable in quality or quantity (replaces the conversational 'good enough').",
        "example": "The hotel provided an adequate breakfast, but it was nothing special.",
        "category": "Academic Adjectives & Adverbs"
    },
    {
        "word": "DETRIMENTAL",
        "meaning": "Tending to cause harm (replaces the conversational 'harmful' or 'bad').",
        "example": "Lack of sleep can be detrimental to your academic performance.",
        "category": "Academic Adjectives & Adverbs"
    },
    {
        "word": "ADVERSE",
        "meaning": "Preventing success or development; harmful; unfavorable (replaces the conversational 'bad' or 'negative').",
        "example": "The drug was recalled due to its adverse side effects.",
        "category": "Academic Adjectives & Adverbs"
    },
    {
        "word": "EXPLICIT",
        "meaning": "Stated clearly and in detail, leaving no room for confusion or doubt (replaces the conversational 'clear' or 'plain').",
        "example": "The teacher gave explicit instructions on how to submit the homework.",
        "category": "Academic Adjectives & Adverbs"
    },
    {
        "word": "IMPLICIT",
        "meaning": "Suggested though not directly expressed (replaces the conversational 'unspoken' or 'hidden').",
        "example": "There was an implicit agreement between the partners that they would share the profits.",
        "category": "Academic Adjectives & Adverbs"
    },
    {
        "word": "SPURIOUS",
        "meaning": "Not being what it purports to be; false or fake (replaces the conversational 'fake' or 'false').",
        "example": "The claims made by the politician were based on spurious data.",
        "category": "Academic Adjectives & Adverbs"
    },
    {
        "word": "COMPLEX",
        "meaning": "Consisting of many different and connected parts (replaces the conversational 'hard' or 'complicated').",
        "example": "The human brain is a complex organ that scientists are still studying.",
        "category": "Academic Adjectives & Adverbs"
    },
    {
        "word": "CONCISE",
        "meaning": "Giving a lot of information clearly and in a few words; brief but comprehensive (replaces the conversational 'short and sweet').",
        "example": "Please write a concise summary of the article in two sentences.",
        "category": "Academic Adjectives & Adverbs"
    },
    {
        "word": "SUCCINCT",
        "meaning": "Briefly and clearly expressed (replaces the conversational 'brief' or 'to the point').",
        "example": "Her argument was succinct and highly persuasive.",
        "category": "Academic Adjectives & Adverbs"
    },
    {
        "word": "VERBOSE",
        "meaning": "Using or expressed in more words than are needed (replaces the conversational 'wordy').",
        "example": "The essay was verbose and could be shortened by half.",
        "category": "Academic Adjectives & Adverbs"
    },
    {
        "word": "ERRONEOUS",
        "meaning": "Wrong; incorrect (replaces the conversational 'wrong').",
        "example": "The belief that the Earth is flat is erroneous.",
        "category": "Academic Adjectives & Adverbs"
    },
    {
        "word": "EQUIVALENT",
        "meaning": "Equal in value, amount, function, meaning, etc (replaces the conversational 'same' or 'equal').",
        "example": "One mile is equivalent to approximately 1.6 kilometers.",
        "category": "Academic Adjectives & Adverbs"
    },
    {
        "word": "ANALOGOUS",
        "meaning": "Comparable in certain respects, typically in a way which makes clearer the nature of the things compared (replaces the conversational 'similar' or 'like').",
        "example": "A camera is analogous to the human eye in how it focuses light.",
        "category": "Academic Adjectives & Adverbs"
    },
    {
        "word": "PLAUSIBLE",
        "meaning": "Seeming reasonable or probable (replaces the conversational 'believable' or 'could be true').",
        "example": "The student offered a plausible explanation for why he was late.",
        "category": "Academic Adjectives & Adverbs"
    },
    {
        "word": "FEASIBLE",
        "meaning": "Possible to do easily or conveniently (replaces the conversational 'doable').",
        "example": "It is not feasible to build a bridge across the ocean with our current technology.",
        "category": "Academic Adjectives & Adverbs"
    },
    {
        "word": "AMBIGUOUS",
        "meaning": "Open to more than one interpretation; having a double meaning (replaces the conversational 'unclear').",
        "example": "The politician's answer was ambiguous, leaving everyone confused about his plans.",
        "category": "Academic Adjectives & Adverbs"
    },
    {
        "word": "UNIVOCAL",
        "meaning": "Having only one possible meaning; unambiguous (replaces the conversational 'clear-cut' or 'single-meaning').",
        "example": "The results of the test provided a univocal answer to our question.",
        "category": "Academic Adjectives & Adverbs"
    },
    {
        "word": "PRECISE",
        "meaning": "Marked by exactness and accuracy of expression or detail (replaces the conversational 'exact').",
        "example": "The scientist needed precise measurements to conduct the experiment.",
        "category": "Academic Adjectives & Adverbs"
    },
    {
        "word": "RATIONAL",
        "meaning": "Based on or in accordance with reason or logic (replaces the conversational 'logical' or 'sensible').",
        "example": "A rational person will evaluate all the facts before making a decision.",
        "category": "Academic Adjectives & Adverbs"
    },
    {
        "word": "EMPIRICAL",
        "meaning": "Based on, concerned with, or verifiable by observation or experience rather than theory (replaces the conversational 'real-world' or 'hands-on').",
        "example": "Our conclusions are backed by solid empirical research.",
        "category": "Academic Adjectives & Adverbs"
    },
    {
        "word": "THEORETICAL",
        "meaning": "Concerned with or involving the theory of a subject or area of study rather than its practical application (replaces the conversational 'in theory' or 'on paper').",
        "example": "The class discussed the theoretical aspects of quantum physics.",
        "category": "Academic Adjectives & Adverbs"
    },
    {
        "word": "TENTATIVE",
        "meaning": "Not certain or fixed; provisional (replaces the conversational 'not sure' or 'temporary').",
        "example": "The committee reached a tentative agreement, subject to final approval.",
        "category": "Academic Adjectives & Adverbs"
    },
    {
        "word": "INHERENT",
        "meaning": "Existing in something as a permanent, essential, or characteristic attribute (replaces the conversational 'built-in' or 'natural').",
        "example": "There are inherent risks in any new business venture.",
        "category": "Academic Adjectives & Adverbs"
    },
    {
        "word": "MUTUAL",
        "meaning": "Shared or experienced by two or more people (replaces the conversational 'two-way' or 'shared').",
        "example": "The two countries signed a treaty based on mutual respect and cooperation.",
        "category": "Academic Adjectives & Adverbs"
    },
    {
        "word": "COMPREHENSIVE",
        "meaning": "Complete; including all or nearly all elements or aspects of something (replaces the conversational 'complete' or 'all-inclusive').",
        "example": "The textbook provides a comprehensive guide to learning Spanish.",
        "category": "Academic Adjectives & Adverbs"
    },
    {
        "word": "DIVERGENT",
        "meaning": "Tending to be different or develop in different directions (replaces the conversational 'different' or 'opposing').",
        "example": "The two political parties hold divergent views on healthcare reform.",
        "category": "Academic Adjectives & Adverbs"
    },
    {
        "word": "DISPARATE",
        "meaning": "Essentially different in kind; not allowing comparison (replaces the conversational 'completely different').",
        "example": "The museum collection brings together disparate objects from across the world.",
        "category": "Academic Adjectives & Adverbs"
    },
    {
        "word": "ANOMALOUS",
        "meaning": "Deviating from what is standard, normal, or expected (replaces the conversational 'weird' or 'unusual').",
        "example": "The test results showed an anomalous pattern that surprised the researchers.",
        "category": "Academic Adjectives & Adverbs"
    },
    {
        "word": "INSUFFICIENT",
        "meaning": "Not enough; inadequate (replaces the conversational 'not enough').",
        "example": "There was insufficient evidence to convict the suspect of the crime.",
        "category": "Academic Adjectives & Adverbs"
    },
    {
        "word": "SUBSEQUENT",
        "meaning": "Coming after something in time; following (replaces the conversational 'next' or 'following').",
        "example": "Subsequent events proved that the scientist's theory was correct.",
        "category": "Academic Adjectives & Adverbs"
    },
    {
        "word": "PRIOR",
        "meaning": "Existing or coming before in time, order, or importance (replaces the conversational 'before' or 'earlier').",
        "example": "You must obtain prior approval before using the laboratory equipment.",
        "category": "Academic Adjectives & Adverbs"
    },
    {
        "word": "CONCURRENT",
        "meaning": "Existing, happening, or done at the same time (replaces the conversational 'at the same time').",
        "example": "The museum hosted two concurrent exhibitions on modern art.",
        "category": "Academic Adjectives & Adverbs"
    },
    {
        "word": "FUNDAMENTAL",
        "meaning": "Forming a necessary base or core; of central importance (replaces the conversational 'basic').",
        "example": "Freedom of speech is a fundamental human right.",
        "category": "Academic Adjectives & Adverbs"
    },
    {
        "word": "INTEGRAL",
        "meaning": "Necessary to make a whole complete; essential or fundamental (replaces the conversational 'key' or 'necessary').",
        "example": "Trust is an integral part of any healthy relationship.",
        "category": "Academic Adjectives & Adverbs"
    },
    {
        "word": "PREEMINENT",
        "meaning": "Surpassing all others; very distinguished in some way (replaces the conversational 'best' or 'top-notch').",
        "example": "She is the preeminent authority on ancient Greek philosophy.",
        "category": "Academic Adjectives & Adverbs"
    },
    {
        "word": "ELUSIVE",
        "meaning": "Difficult to find, catch, or achieve (replaces the conversational 'hard to catch' or 'hard to define').",
        "example": "A perfect solution to the economic problem remains elusive.",
        "category": "Academic Adjectives & Adverbs"
    },
    {
        "word": "IMPRACTICAL",
        "meaning": "Not sensible or realistic to use or carry out in practice (replaces the conversational 'senseless' or 'won't work').",
        "example": "It is impractical to wear high heels when hiking in the mountains.",
        "category": "Academic Adjectives & Adverbs"
    },
    {
        "word": "VIABLE",
        "meaning": "Capable of working successfully; feasible (replaces the conversational 'workable' or 'usable').",
        "example": "The committee is looking for a viable alternative to the current system.",
        "category": "Academic Adjectives & Adverbs"
    },
    {
        "word": "OPTIMAL",
        "meaning": "Best or most favorable (replaces the conversational 'best possible').",
        "example": "The plants grew best under optimal temperature and light conditions.",
        "category": "Academic Adjectives & Adverbs"
    },
    {
        "word": "PARADIGMATIC",
        "meaning": "Serving as a typical example of something (replaces the conversational 'classic example of').",
        "example": "The company's success is a paradigmatic case of effective leadership.",
        "category": "Academic Adjectives & Adverbs"
    },
    {
        "word": "PERVASIVE",
        "meaning": "Widespread throughout an area or a group of people (replaces the conversational 'everywhere' or 'widespread').",
        "example": "The influence of social media is pervasive in modern society.",
        "category": "Academic Adjectives & Adverbs"
    },
    {
        "word": "INCONTROVERTIBLE",
        "meaning": "Not able to be denied or disputed (replaces the conversational 'undeniable').",
        "example": "The DNA evidence provided incontrovertible proof of his innocence.",
        "category": "Academic Adjectives & Adverbs"
    },
    {
        "word": "IRREFUTABLE",
        "meaning": "Impossible to deny or disprove (replaces the conversational 'impossible to deny').",
        "example": "The scientist presented irrefutable evidence supporting climate change.",
        "category": "Academic Adjectives & Adverbs"
    },
    {
        "word": "TENUOUS",
        "meaning": "Very weak or slight; shaky (replaces the conversational 'weak' or 'shaky').",
        "example": "The connection between the two events was tenuous at best.",
        "category": "Academic Adjectives & Adverbs"
    },
    {
        "word": "REDUNDANT",
        "meaning": "Not or no longer needed or useful; superfluous (replaces the conversational 'extra' or 'not needed').",
        "example": "The paragraph was redundant and should be deleted from the essay.",
        "category": "Academic Adjectives & Adverbs"
    },
    {
        "word": "AMBIGUITY",
        "meaning": "The quality of being open to more than one interpretation (replaces the conversational 'unclearness' or 'vagueness').",
        "example": "The ambiguity in the contract led to a long legal dispute.",
        "category": "Academic Adjectives & Adverbs"
    }
];

const outputDir = path.resolve('D:/English Vidya/website/data/grammar/dictionary_batches');
const outputFile = path.join(outputDir, 'v4_academic_vs_conv.json');

if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
}

fs.writeFileSync(outputFile, JSON.stringify(data, null, 2), 'utf-8');
console.log(`Successfully generated ${data.length} items in ${outputFile}`);
