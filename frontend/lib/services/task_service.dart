import 'package:frontend/models/task_mode.dart';
import 'package:frontend/models/task_sort_option_model.dart';
import 'package:frontend/models/task_model.dart';
import 'package:frontend/services/api_service.dart';
import 'package:frontend/services/websocket_service.dart';

enum TaskAcceptResult {
  accepted,
  ownTask,
  alreadyAccepted,
  pendingApproval,
  notFound,
}

enum TaskAcceptanceDecisionResult {
  accepted,
  declined,
  notFound,
  notTaskOwner,
  noPendingRequest,
  alreadyAccepted,
}

enum TaskCompletionRequestResult {
  requested,
  notFound,
  notAcceptedHelper,
  alreadyCompleted,
}

enum TaskCompletionConfirmResult {
  completed,
  declined,
  notFound,
  notTaskOwner,
  noPendingRequest,
  alreadyCompleted,
}

enum TaskRatingResult {
  rated,
  notFound,
  notTaskOwner,
  notCompleted,
  noPendingRating,
  invalidRating,
}

class TaskMutationResult<T> {
  const TaskMutationResult({
    required this.outcome,
    this.task,
  });

  final T outcome;
  final TaskModel? task;
}

class TaskService {
  TaskService({ApiService? apiService})
      : _apiService = apiService ?? ApiService();

  final ApiService _apiService;

  static const List<TaskSortOptionModel> _sortOptions = [
    TaskSortOptionModel(type: TaskSortType.defaultOrder, label: 'Default'),
    TaskSortOptionModel(type: TaskSortType.distance, label: 'Distance'),
    TaskSortOptionModel(type: TaskSortType.closestDate, label: 'Closest date'),
    TaskSortOptionModel(type: TaskSortType.latestDate, label: 'Latest date'),
    TaskSortOptionModel(type: TaskSortType.online, label: 'Online'),
    TaskSortOptionModel(type: TaskSortType.offline, label: 'Offline'),
  ];

  List<Map<String, dynamic>> _taskStore = const [];
  double? _acceptorLat;
  double? _acceptorLng;

  Future<List<TaskSortOptionModel>> fetchSortOptions() async {
    return _sortOptions;
  }

  Future<List<TaskModel>> fetchTasks({TaskSortType? sortBy}) async {
    return fetchTaskWindow(
      sortBy: sortBy,
      status: 'open',
      page: 1,
      pageSize: 25,
    );
  }

  Future<List<TaskModel>> fetchTaskWindow({
    TaskSortType? sortBy,
    String? status,
    int? page,
    int? pageSize,
  }) async {
    try {
      final response = await _apiService.getJson(
        '/v1/tasks',
        queryParameters: {
          'sortBy': _toApiSortValue(sortBy),
          'status': status,
          'page': page,
          'pageSize': pageSize,
          'acceptorLat': _acceptorLat,
          'acceptorLng': _acceptorLng,
        },
      );
      final rawTasks = (response['tasks'] as List<dynamic>? ?? const <dynamic>[])
          .whereType<Map>()
          .map((item) => Map<String, dynamic>.from(item))
          .toList(growable: false);

      final tasks = rawTasks.map(TaskModel.fromJson).toList(growable: false);
      _taskStore = rawTasks;
      return tasks;
    } catch (_) {
      if (_taskStore.isEmpty) {
        rethrow;
      }

      var tasks = _taskStore.map(TaskModel.fromJson).toList(growable: false);
      if (status != null && status.isNotEmpty) {
        tasks = tasks.where((task) {
          switch (status) {
            case 'open':
              return task.isActive && task.acceptedByUserId == null;
            case 'accepted':
              return task.acceptedByUserId != null;
            case 'completed':
              return !task.isActive;
            default:
              return true;
          }
        }).toList(growable: false);
      }
      final sorted = _sortTasks(tasks, sortBy);
      if (page == null || pageSize == null || page < 1 || pageSize < 1) {
        return sorted;
      }
      final start = (page - 1) * pageSize;
      if (start >= sorted.length) {
        return const [];
      }
      final end = (start + pageSize).clamp(0, sorted.length) as int;
      return sorted.sublist(start, end);
    }
  }

  Future<List<TaskModel>> fetchMyTaskHistory({
    TaskSortType? sortBy,
    int? page,
    int? pageSize,
  }) async {
    final response = await _apiService.getJson(
      '/v1/tasks/history/me',
      queryParameters: {
        'sortBy': _toApiSortValue(sortBy) ?? 'latestDate',
        'page': page,
        'pageSize': pageSize,
      },
    );
    final rawTasks = (response['tasks'] as List<dynamic>? ?? const <dynamic>[])
        .whereType<Map>()
        .map((item) => Map<String, dynamic>.from(item))
        .toList(growable: false);
    for (final task in rawTasks) {
      _upsertTaskCache(task);
    }
    return rawTasks.map(TaskModel.fromJson).toList(growable: false);
  }

  void setAcceptorLocation({double? lat, double? lng}) {
    _acceptorLat = lat;
    _acceptorLng = lng;
  }

  Future<TaskModel> createTask({
    required String title,
    required String description,
    required String location,
    required double price,
    required DateTime scheduledAt,
    required TaskExecutionMode executionMode,
    required String postedByUserId,
    required String postedByName,
    TaskLocationGeo? locationGeo,
  }) async {
    await WebSocketService.instance.touch();
    final response = await _apiService.postJson(
      '/v1/tasks',
      body: {
        'title': title,
        'description': description,
        'location': location,
        'price': price,
        'scheduledAt': scheduledAt.toIso8601String(),
        'executionMode': executionMode.storageValue,
        'postedByUserId': postedByUserId,
        'postedByName': postedByName,
        'locationGeo': locationGeo?.toJson(),
      },
    );

    final rawTask = response['task'];
    if (rawTask is! Map) {
      throw Exception('Invalid task response.');
    }

    final created = TaskModel.fromJson(Map<String, dynamic>.from(rawTask));
    _upsertTaskCache(created.toJson());
    return created;
  }

  Future<TaskMutationResult<TaskAcceptResult>> acceptTask({
    required String taskId,
    required String userId,
  }) async {
    try {
      await WebSocketService.instance.touch();
      final response = await _apiService.postJson(
        '/v1/tasks/$taskId/accept',
        body: {
          'acceptedByUserId': userId,
        },
      );
      _upsertTaskCache(response['task']);
      final task = response['task'];
      final parsedTask =
          task is Map ? TaskModel.fromJson(Map<String, dynamic>.from(task)) : null;
      if (task is Map && task['acceptedByUserId'] == null) {
        return TaskMutationResult(
          outcome: TaskAcceptResult.pendingApproval,
          task: parsedTask,
        );
      }
      return TaskMutationResult(
        outcome: TaskAcceptResult.accepted,
        task: parsedTask,
      );
    } on ApiException catch (error) {
      if (error.statusCode == 404) {
        return const TaskMutationResult(outcome: TaskAcceptResult.notFound);
      }
      if (error.statusCode == 409) {
        return const TaskMutationResult(
          outcome: TaskAcceptResult.alreadyAccepted,
        );
      }
      if (error.statusCode == 400 &&
          error.message.toLowerCase().contains('own task')) {
        return const TaskMutationResult(outcome: TaskAcceptResult.ownTask);
      }
      rethrow;
    }
  }

  Future<TaskMutationResult<TaskAcceptanceDecisionResult>> confirmTaskAcceptance({
    required String taskId,
    required String ownerUserId,
  }) async {
    try {
      await WebSocketService.instance.touch();
      final response = await _apiService.postJson(
        '/v1/tasks/$taskId/accept/confirm',
        body: {
          'ownerUserId': ownerUserId,
        },
      );
      _upsertTaskCache(response['task']);
      return TaskMutationResult(
        outcome: TaskAcceptanceDecisionResult.accepted,
        task: response['task'] is Map
            ? TaskModel.fromJson(Map<String, dynamic>.from(response['task'] as Map))
            : null,
      );
    } on ApiException catch (error) {
      if (error.statusCode == 404) {
        return const TaskMutationResult(
          outcome: TaskAcceptanceDecisionResult.notFound,
        );
      }
      if (error.statusCode == 403) {
        return const TaskMutationResult(
          outcome: TaskAcceptanceDecisionResult.notTaskOwner,
        );
      }
      if (error.statusCode == 409 &&
          error.message.toLowerCase().contains('already accepted')) {
        return const TaskMutationResult(
          outcome: TaskAcceptanceDecisionResult.alreadyAccepted,
        );
      }
      if (error.statusCode == 409 &&
          error.message.toLowerCase().contains('no pending acceptance')) {
        return const TaskMutationResult(
          outcome: TaskAcceptanceDecisionResult.noPendingRequest,
        );
      }
      rethrow;
    }
  }

  Future<TaskMutationResult<TaskAcceptanceDecisionResult>> declineTaskAcceptance({
    required String taskId,
    required String ownerUserId,
  }) async {
    try {
      await WebSocketService.instance.touch();
      final response = await _apiService.postJson(
        '/v1/tasks/$taskId/accept/decline',
        body: {
          'ownerUserId': ownerUserId,
        },
      );
      _upsertTaskCache(response['task']);
      return TaskMutationResult(
        outcome: TaskAcceptanceDecisionResult.declined,
        task: response['task'] is Map
            ? TaskModel.fromJson(Map<String, dynamic>.from(response['task'] as Map))
            : null,
      );
    } on ApiException catch (error) {
      if (error.statusCode == 404) {
        return const TaskMutationResult(
          outcome: TaskAcceptanceDecisionResult.notFound,
        );
      }
      if (error.statusCode == 403) {
        return const TaskMutationResult(
          outcome: TaskAcceptanceDecisionResult.notTaskOwner,
        );
      }
      if (error.statusCode == 409 &&
          error.message.toLowerCase().contains('already accepted')) {
        return const TaskMutationResult(
          outcome: TaskAcceptanceDecisionResult.alreadyAccepted,
        );
      }
      if (error.statusCode == 409 &&
          error.message.toLowerCase().contains('no pending acceptance')) {
        return const TaskMutationResult(
          outcome: TaskAcceptanceDecisionResult.noPendingRequest,
        );
      }
      rethrow;
    }
  }

  Future<TaskMutationResult<TaskCompletionRequestResult>> requestTaskCompletion({
    required String taskId,
    required String helperUserId,
  }) async {
    try {
      await WebSocketService.instance.touch();
      final response = await _apiService.postJson(
        '/v1/tasks/$taskId/completion/request',
        body: {
          'helperUserId': helperUserId,
        },
      );
      _upsertTaskCache(response['task']);
      return TaskMutationResult(
        outcome: TaskCompletionRequestResult.requested,
        task: response['task'] is Map
            ? TaskModel.fromJson(Map<String, dynamic>.from(response['task'] as Map))
            : null,
      );
    } on ApiException catch (error) {
      if (error.statusCode == 404) {
        return const TaskMutationResult(
          outcome: TaskCompletionRequestResult.notFound,
        );
      }
      if (error.statusCode == 409) {
        return const TaskMutationResult(
          outcome: TaskCompletionRequestResult.alreadyCompleted,
        );
      }
      if (error.statusCode == 403) {
        return const TaskMutationResult(
          outcome: TaskCompletionRequestResult.notAcceptedHelper,
        );
      }
      rethrow;
    }
  }

  Future<TaskMutationResult<TaskCompletionConfirmResult>> confirmTaskCompletion({
    required String taskId,
    required String ownerUserId,
  }) async {
    try {
      await WebSocketService.instance.touch();
      final response = await _apiService.postJson(
        '/v1/tasks/$taskId/completion/confirm',
        body: {
          'ownerUserId': ownerUserId,
        },
      );
      _upsertTaskCache(response['task']);
      return TaskMutationResult(
        outcome: TaskCompletionConfirmResult.completed,
        task: response['task'] is Map
            ? TaskModel.fromJson(Map<String, dynamic>.from(response['task'] as Map))
            : null,
      );
    } on ApiException catch (error) {
      if (error.statusCode == 404) {
        return const TaskMutationResult(
          outcome: TaskCompletionConfirmResult.notFound,
        );
      }
      if (error.statusCode == 403) {
        return const TaskMutationResult(
          outcome: TaskCompletionConfirmResult.notTaskOwner,
        );
      }
      if (error.statusCode == 409 &&
          error.message.toLowerCase().contains('already completed')) {
        return const TaskMutationResult(
          outcome: TaskCompletionConfirmResult.alreadyCompleted,
        );
      }
      if (error.statusCode == 409 &&
          error.message.toLowerCase().contains('no pending completion')) {
        return const TaskMutationResult(
          outcome: TaskCompletionConfirmResult.noPendingRequest,
        );
      }
      rethrow;
    }
  }

  Future<TaskMutationResult<TaskCompletionConfirmResult>> declineTaskCompletion({
    required String taskId,
    required String ownerUserId,
  }) async {
    try {
      await WebSocketService.instance.touch();
      final response = await _apiService.postJson(
        '/v1/tasks/$taskId/completion/decline',
        body: {
          'ownerUserId': ownerUserId,
        },
      );
      _upsertTaskCache(response['task']);
      return TaskMutationResult(
        outcome: TaskCompletionConfirmResult.declined,
        task: response['task'] is Map
            ? TaskModel.fromJson(Map<String, dynamic>.from(response['task'] as Map))
            : null,
      );
    } on ApiException catch (error) {
      if (error.statusCode == 404) {
        return const TaskMutationResult(
          outcome: TaskCompletionConfirmResult.notFound,
        );
      }
      if (error.statusCode == 403) {
        return const TaskMutationResult(
          outcome: TaskCompletionConfirmResult.notTaskOwner,
        );
      }
      if (error.statusCode == 409 &&
          error.message.toLowerCase().contains('already completed')) {
        return const TaskMutationResult(
          outcome: TaskCompletionConfirmResult.alreadyCompleted,
        );
      }
      if (error.statusCode == 409 &&
          error.message.toLowerCase().contains('no pending completion')) {
        return const TaskMutationResult(
          outcome: TaskCompletionConfirmResult.noPendingRequest,
        );
      }
      rethrow;
    }
  }

  Future<TaskMutationResult<TaskRatingResult>> submitTaskRating({
    required String taskId,
    required String ownerUserId,
    required double rating,
  }) async {
    try {
      await WebSocketService.instance.touch();
      final response = await _apiService.postJson(
        '/v1/tasks/$taskId/rating',
        body: {
          'ownerUserId': ownerUserId,
          'rating': rating,
        },
      );
      _upsertTaskCache(response['task']);
      return TaskMutationResult(
        outcome: TaskRatingResult.rated,
        task: response['task'] is Map
            ? TaskModel.fromJson(Map<String, dynamic>.from(response['task'] as Map))
            : null,
      );
    } on ApiException catch (error) {
      if (error.statusCode == 404) {
        return const TaskMutationResult(outcome: TaskRatingResult.notFound);
      }
      if (error.statusCode == 403) {
        return const TaskMutationResult(
          outcome: TaskRatingResult.notTaskOwner,
        );
      }
      if (error.statusCode == 400) {
        return const TaskMutationResult(
          outcome: TaskRatingResult.invalidRating,
        );
      }
      if (error.statusCode == 409 &&
          error.message.toLowerCase().contains('not completed')) {
        return const TaskMutationResult(
          outcome: TaskRatingResult.notCompleted,
        );
      }
      if (error.statusCode == 409 &&
          error.message.toLowerCase().contains('no pending rating')) {
        return const TaskMutationResult(
          outcome: TaskRatingResult.noPendingRating,
        );
      }
      rethrow;
    }
  }

  Future<Map<String, dynamic>> processVoiceInput(String text) async {
    final response = await _apiService.postJson(
      '/v1/voice/parse-task',
      body: {
        'transcript': text,
      },
      timeout: const Duration(seconds: 50),
    );

    final rawDraft = response['draft'];
    if (rawDraft is! Map) {
      throw Exception('Invalid voice draft response.');
    }

    return Map<String, dynamic>.from(rawDraft);
  }

  List<TaskModel> _sortTasks(List<TaskModel> tasks, TaskSortType? sortBy) {
    if (sortBy == null) {
      return tasks;
    }

    final sorted = List<TaskModel>.from(tasks);
    switch (sortBy) {
      case TaskSortType.defaultOrder:
        return sorted;
      case TaskSortType.distance:
        sorted.sort((a, b) => a.distanceKm.compareTo(b.distanceKm));
        return sorted;
      case TaskSortType.closestDate:
        sorted.sort((a, b) => a.scheduledAt.compareTo(b.scheduledAt));
        return sorted;
      case TaskSortType.latestDate:
        sorted.sort((a, b) => b.scheduledAt.compareTo(a.scheduledAt));
        return sorted;
      case TaskSortType.online:
        return sorted
            .where((task) => task.executionMode == TaskExecutionMode.online)
            .toList(growable: false);
      case TaskSortType.offline:
        return sorted
            .where((task) => task.executionMode == TaskExecutionMode.offline)
            .toList(growable: false);
    }
  }

  String? _toApiSortValue(TaskSortType? sortBy) {
    switch (sortBy) {
      case null:
        return null;
      case TaskSortType.defaultOrder:
        return 'default';
      case TaskSortType.distance:
        return 'distance';
      case TaskSortType.closestDate:
        return 'closestDate';
      case TaskSortType.latestDate:
        return 'latestDate';
      case TaskSortType.online:
        return 'online';
      case TaskSortType.offline:
        return 'offline';
    }
  }

  void _upsertTaskCache(dynamic rawTask) {
    if (rawTask is! Map) {
      return;
    }

    final taskMap = Map<String, dynamic>.from(rawTask);
    final taskId = taskMap['id'];
    if (taskId is! String || taskId.isEmpty) {
      return;
    }

    final existingIndex = _taskStore.indexWhere((task) => task['id'] == taskId);
    if (existingIndex < 0) {
      _taskStore = [taskMap, ..._taskStore];
      return;
    }

    final next = List<Map<String, dynamic>>.from(_taskStore);
    next[existingIndex] = taskMap;
    _taskStore = next;
  }
}
