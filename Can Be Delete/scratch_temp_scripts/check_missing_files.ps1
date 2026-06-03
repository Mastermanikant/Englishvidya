$expected = @(
  'v4_basic_reply.json', 'v4_daily_object.json', 'v4_human.json', 'v4_place.json', 'v4_daily_action.json', 'v4_daily_need.json', 'v4_common_emotion.json', 'v4_common_social.json', 'v4_direction.json', 'v4_usage_priority.json', 'v4_friendly_vs_pro.json', 'v4_personality.json', 'v4_emotional_interaction.json', 'v4_spoken_object.json', 'v4_home_instruction.json', 'v4_home_action.json', 'v4_cooking_action.json', 'v4_taste_description.json',
  'v4_environmental.json', 'v4_env_discussion.json', 'v4_env_weak.json', 'v4_nature_descriptive.json', 'v4_school_textbook.json', 'v4_nature_observation.json', 'v4_nature_action.json', 'v4_emotional_intensity.json', 'v4_daily_social_conv.json', 'v4_small_talk.json', 'v4_instant_comm.json', 'v4_conv_confidence.json', 'v4_human_interaction.json', 'v4_native_combinations.json', 'v4_informal_alternatives.json', 'v4_internet_alternatives.json', 'v4_social_context.json',
  'v4_weak_professional.json', 'v4_native_connectors.json', 'v4_unfamiliar_words.json', 'v4_advanced_bridge.json', 'v4_subject_specific.json', 'v4_formal_edu.json', 'v4_english_medium.json', 'v4_teaching_language.json', 'v4_technical_fear.json', 'v4_subject_understanding.json', 'v4_academic_confidence.json', 'v4_modern_comm.json', 'v4_future_work.json', 'v4_digital_workplace.json', 'v4_weak_digital.json',
  'v4_human_thinking.json', 'v4_logical_fallacies.json', 'v4_abstract_emotional.json', 'v4_modern_intellectual.json', 'v4_academic_vs_conv.json', 'v4_natural_reasoning.json', 'v4_abstract_strong.json', 'v4_critical_thinking.json', 'v4_future_reasoning.json', 'v4_native_acquisition.json', 'v4_child_language.json', 'v4_emotional_response.json', 'v4_beginner_comm.json', 'v4_native_usage.json'
)

$batchesDir = "D:\English Vidya\website\data\grammar\dictionary_batches"
$missing = @()

foreach ($f in $expected) {
    $path = Join-Path $batchesDir $f
    if (-not (Test-Path $path)) {
        $missing += $f
    } else {
        $len = (Get-Item $path).Length
        if ($len -eq 0) {
            $missing += ($f + " (empty)")
        }
    }
}

Write-Output "Total Expected: $($expected.Count)"
Write-Output "Missing Count: $($missing.Count)"
Write-Output "Missing/Empty Files:"
foreach ($m in $missing) {
    Write-Output " - $m"
}
