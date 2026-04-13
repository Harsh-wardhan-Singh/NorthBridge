import 'package:frontend/models/task_model.dart';
import 'package:frontend/services/test_data/task_test_data.dart';

enum TaskAcceptResult {
  accepted,
  ownTask,
  alreadyAccepted,
  notFound,
}

class TaskService {
  static List<Map<String, dynamic>> _taskStore = taskPreviewApiResponse
      .map((task) => Map<String, dynamic>.from(task))
      .toList();

  Future<List<TaskModel>> fetchTasks() async {
    await Future<void>.delayed(const Duration(milliseconds: 250));

    return _taskStore.map(TaskModel.fromJson).toList(growable: false);
  }

  Future<TaskModel> createTask({
    required String title,
    required String description,
    required String location,
    required double price,
    required DateTime scheduledAt,
    String postedByUserId = 'u_1001',
    String postedByName = 'Aarav Sharma',
  }) async {
    await Future<void>.delayed(const Duration(milliseconds: 300));

    final created = TaskModel(
      id: DateTime.now().millisecondsSinceEpoch.toString(),
      postedByUserId: postedByUserId,
      postedByName: postedByName,
      title: title,
      description: description,
      location: location,
      price: price,
      distanceKm: 0,
      scheduledAt: scheduledAt,
    );

    _taskStore = [
      created.toJson(),
      ..._taskStore,
    ];

    return created;
  }

  Future<TaskAcceptResult> acceptTask({
    required String taskId,
    required String userId,
  }) async {
    await Future<void>.delayed(const Duration(milliseconds: 220));

    final taskIndex = _taskStore.indexWhere((task) => task['id'] == taskId);
    if (taskIndex < 0) {
      return TaskAcceptResult.notFound;
    }

    final current = TaskModel.fromJson(_taskStore[taskIndex]);
    if (current.postedByUserId == userId) {
      return TaskAcceptResult.ownTask;
    }

    if (current.acceptedByUserId != null &&
        current.acceptedByUserId != userId) {
      return TaskAcceptResult.alreadyAccepted;
    }

    final updated = current.copyWith(
      acceptedByUserId: userId,
      acceptedAt: DateTime.now().toUtc(),
    );

    final next = List<Map<String, dynamic>>.from(_taskStore);
    next[taskIndex] = updated.toJson();
    _taskStore = next;
    return TaskAcceptResult.accepted;
  }

  Future<Map<String, dynamic>> processVoiceInput(String text) async {
    await Future<void>.delayed(const Duration(milliseconds: 500));

    final cleaned = text.trim();
    final words =
        cleaned.split(RegExp(r'\s+')).where((w) => w.isNotEmpty).toList();
    final priceMatch = RegExp(r'(\d+(?:\.\d+)?)').firstMatch(cleaned);
    final parsedPrice = double.tryParse(priceMatch?.group(1) ?? '');

    final locationMatch = RegExp(
      r'(?:in|at)\s+([A-Za-z0-9\s,]+)',
      caseSensitive: false,
    ).firstMatch(cleaned);
    final parsedLocation = locationMatch?.group(1)?.trim();

    final shortTitle = words.take(6).join(' ');

    return {
      'title': shortTitle.isEmpty ? 'Voice task' : shortTitle,
      'description':
          cleaned.isEmpty ? 'Task details from voice input.' : cleaned,
      'location':
          parsedLocation?.isNotEmpty == true ? parsedLocation : 'Add location',
      'price': parsedPrice ?? 0,
      'scheduledAt':
          DateTime.now().add(const Duration(hours: 1)).toIso8601String(),
    };
  }
}
