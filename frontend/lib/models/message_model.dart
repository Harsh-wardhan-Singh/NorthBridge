class MessageModel {
  const MessageModel({
    required this.id,
    required this.chatId,
    required this.taskId,
    required this.senderId,
    required this.text,
    required this.timestamp,
  });

  final String id;
  final String chatId;
  final String taskId;
  final String senderId;
  final String text;
  final DateTime timestamp;

  factory MessageModel.fromJson(Map<String, dynamic> json) {
    return MessageModel(
      id: json['id'] as String,
      chatId: json['chatId'] as String,
      taskId: json['taskId'] as String,
      senderId: json['senderId'] as String,
      text: json['text'] as String,
      timestamp: DateTime.parse(json['timestamp'] as String),
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'chatId': chatId,
      'taskId': taskId,
      'senderId': senderId,
      'text': text,
      'timestamp': timestamp.toIso8601String(),
    };
  }
}
