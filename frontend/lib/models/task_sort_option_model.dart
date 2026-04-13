enum TaskSortType {
  defaultOrder,
  distance,
  closestDate,
  latestDate,
  online,
  offline;

  static TaskSortType? fromValue(String? value) {
    switch ((value ?? '').toLowerCase()) {
      case 'default':
        return TaskSortType.defaultOrder;
      case 'distance':
        return TaskSortType.distance;
      case 'closestdate':
        return TaskSortType.closestDate;
      case 'latestdate':
        return TaskSortType.latestDate;
      case 'online':
        return TaskSortType.online;
      case 'offline':
        return TaskSortType.offline;
      default:
        return null;
    }
  }
}

class TaskSortOptionModel {
  const TaskSortOptionModel({
    required this.type,
    required this.label,
  });

  final TaskSortType type;
  final String label;

  factory TaskSortOptionModel.fromJson(Map<String, dynamic> json) {
    final resolvedType = TaskSortType.fromValue(json['type'] as String?);
    return TaskSortOptionModel(
      type: resolvedType ?? TaskSortType.defaultOrder,
      label: json['label'] as String? ?? 'Default',
    );
  }
}
