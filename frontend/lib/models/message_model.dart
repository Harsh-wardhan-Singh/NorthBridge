class MessageModel {
  const MessageModel({
    required this.id,
    required this.chatId,
    required this.taskId,
    required this.senderId,
    required this.text,
    required this.timestamp,
    this.imageDataUrl,
    this.isPaymentRequest = false,
  });

  final String id;
  final String chatId;
  final String taskId;
  final String senderId;
  final String text;
  final DateTime timestamp;
  final String? imageDataUrl;
  final bool isPaymentRequest;

  factory MessageModel.fromJson(Map<String, dynamic> json) {
    return MessageModel(
      id: json['id'] as String,
      chatId: json['chatId'] as String,
      taskId: json['taskId'] as String,
      senderId: json['senderId'] as String,
      text: json['text'] as String,
      timestamp: DateTime.parse(json['timestamp'] as String),
      imageDataUrl: json['imageDataUrl'] as String?,
      isPaymentRequest: json['isPaymentRequest'] as bool? ?? false,
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
      'imageDataUrl': imageDataUrl,
      'isPaymentRequest': isPaymentRequest,
    };
  }
}
