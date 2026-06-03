$script = "d:\English Vidya\scratch\extract_generic.ps1"

& powershell -ExecutionPolicy Bypass -File $script -OutputFile "d:\English Vidya\website\data\grammar\adjectives.json" -TopicTitle "Adjective System" -TopicTitleHi "विशेषण प्रणाली" -StartRegex 'Part 19.*Adjective System' -EndRegex 'Part 20'
& powershell -ExecutionPolicy Bypass -File $script -OutputFile "d:\English Vidya\website\data\grammar\verbs.json" -TopicTitle "Verb System" -TopicTitleHi "क्रिया प्रणाली" -StartRegex 'Part 20.*Verb System' -EndRegex 'Part 21'
& powershell -ExecutionPolicy Bypass -File $script -OutputFile "d:\English Vidya\website\data\grammar\adverbs.json" -TopicTitle "Adverb System" -TopicTitleHi "क्रिया विशेषण प्रणाली" -StartRegex 'Part 23.*Adverb System' -EndRegex 'Part 24'
& powershell -ExecutionPolicy Bypass -File $script -OutputFile "d:\English Vidya\website\data\grammar\prepositions.json" -TopicTitle "Preposition System" -TopicTitleHi "संबंधबोधक अव्यय प्रणाली" -StartRegex 'Part 24.*Preposition System' -EndRegex 'Part 25'
& powershell -ExecutionPolicy Bypass -File $script -OutputFile "d:\English Vidya\website\data\grammar\conjunctions.json" -TopicTitle "Conjunction System" -TopicTitleHi "समुच्चयबोधक अव्यय प्रणाली" -StartRegex 'Part 25.*Conjunction System' -EndRegex 'Part 26'
& powershell -ExecutionPolicy Bypass -File $script -OutputFile "d:\English Vidya\website\data\grammar\interjections.json" -TopicTitle "Interjection System" -TopicTitleHi "विस्मयादिबोधक अव्यय प्रणाली" -StartRegex 'Part 26.*Interjection System' -EndRegex 'Part 27'

Write-Host "All Extractions completed!"
