class VoiceInstructionItemModel {
  const VoiceInstructionItemModel({
    required this.english,
    required this.hindi,
  });

  final String english;
  final String hindi;

  factory VoiceInstructionItemModel.fromJson(Map<String, dynamic> json) {
    return VoiceInstructionItemModel(
      english: json['english'] as String? ?? '',
      hindi: json['hindi'] as String? ?? '',
    );
  }
}
