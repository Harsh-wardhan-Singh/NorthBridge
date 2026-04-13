enum TaskExecutionMode {
  online,
  offline;

  static TaskExecutionMode fromValue(String? value) {
    switch ((value ?? '').toLowerCase()) {
      case 'online':
        return TaskExecutionMode.online;
      case 'offline':
      default:
        return TaskExecutionMode.offline;
    }
  }
}

extension TaskExecutionModeX on TaskExecutionMode {
  String get storageValue {
    switch (this) {
      case TaskExecutionMode.online:
        return 'online';
      case TaskExecutionMode.offline:
        return 'offline';
    }
  }

  String get displayLabel {
    switch (this) {
      case TaskExecutionMode.online:
        return 'Online';
      case TaskExecutionMode.offline:
        return 'Offline';
    }
  }
}
