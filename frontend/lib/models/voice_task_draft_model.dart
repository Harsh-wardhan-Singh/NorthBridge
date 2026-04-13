import 'package:frontend/models/task_mode.dart';

class VoiceTaskDraftModel {
  const VoiceTaskDraftModel({
    required this.title,
    required this.description,
    required this.location,
    required this.price,
    required this.scheduledAt,
    required this.executionMode,
  });

  final String title;
  final String description;
  final String location;
  final double price;
  final DateTime scheduledAt;
  final TaskExecutionMode executionMode;

  VoiceTaskDraftModel copyWith({
    String? title,
    String? description,
    String? location,
    double? price,
    DateTime? scheduledAt,
    TaskExecutionMode? executionMode,
  }) {
    return VoiceTaskDraftModel(
      title: title ?? this.title,
      description: description ?? this.description,
      location: location ?? this.location,
      price: price ?? this.price,
      scheduledAt: scheduledAt ?? this.scheduledAt,
      executionMode: executionMode ?? this.executionMode,
    );
  }

  factory VoiceTaskDraftModel.fromJson(Map<String, dynamic> json) {
    return VoiceTaskDraftModel(
      title: json['title'] as String? ?? '',
      description: json['description'] as String? ?? '',
      location: json['location'] as String? ?? '',
      price: (json['price'] as num?)?.toDouble() ?? 0,
      scheduledAt: DateTime.parse(
        json['scheduledAt'] as String? ??
            DateTime.now().add(const Duration(hours: 1)).toIso8601String(),
      ),
      executionMode:
          TaskExecutionMode.fromValue(json['executionMode'] as String?),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'title': title,
      'description': description,
      'location': location,
      'price': price,
      'scheduledAt': scheduledAt.toIso8601String(),
      'executionMode': executionMode.storageValue,
    };
  }
}
