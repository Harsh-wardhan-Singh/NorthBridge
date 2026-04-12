import 'package:flutter/material.dart';
import 'package:frontend/core/constants/app_spacing.dart';
import 'package:frontend/core/utils/date_time_utils.dart';
import 'package:frontend/models/chat_model.dart';
import 'package:frontend/providers/chat_provider.dart';
import 'package:frontend/widgets/app_button.dart';

class ChatThreadScreen extends StatefulWidget {
  const ChatThreadScreen({
    super.key,
    required this.chatProvider,
    required this.chat,
  });

  static const String routeName = '/chat/thread';

  final ChatProvider chatProvider;
  final ChatModel chat;

  @override
  State<ChatThreadScreen> createState() => _ChatThreadScreenState();
}

class _ChatThreadScreenState extends State<ChatThreadScreen> {
  final TextEditingController _messageController = TextEditingController();

  String get _senderId {
    return widget.chat.users.firstWhere(
      (userId) => userId != widget.chat.taskOwnerUserId,
      orElse: () => widget.chat.taskOwnerUserId,
    );
  }

  @override
  void initState() {
    super.initState();
    widget.chatProvider.loadMessages(widget.chat.chatId);
  }

  @override
  void dispose() {
    _messageController.dispose();
    super.dispose();
  }

  Future<void> _send() async {
    final text = _messageController.text.trim();
    if (text.isEmpty) {
      return;
    }

    _messageController.clear();
    await widget.chatProvider.sendMessage(
      chatId: widget.chat.chatId,
      taskId: widget.chat.taskId,
      senderId: _senderId,
      text: text,
    );
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Conversation'),
      ),
      body: Center(
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 720),
          child: Padding(
            padding: AppSpacing.screenPadding,
            child: AnimatedBuilder(
              animation: widget.chatProvider,
              builder: (context, _) {
                final state = widget.chatProvider.messagesState;
                final messages = state.data ?? const [];

                if (state.isLoading && messages.isEmpty) {
                  return const Center(child: CircularProgressIndicator());
                }

                if (state.isError && messages.isEmpty) {
                  return Center(
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text(
                          state.message ?? 'Unable to load messages.',
                          style: theme.textTheme.bodyMedium,
                          textAlign: TextAlign.center,
                        ),
                        const SizedBox(height: AppSpacing.md),
                        AppButton(
                          label: 'Retry',
                          onPressed: () => widget.chatProvider
                              .loadMessages(widget.chat.chatId),
                          isFullWidth: false,
                        ),
                      ],
                    ),
                  );
                }

                if (state.isEmpty || messages.isEmpty) {
                  return Center(
                    child: Text(
                      state.message ?? 'No messages yet.',
                      style: theme.textTheme.bodyMedium,
                    ),
                  );
                }

                return Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      'Task: ${widget.chat.taskTitle}',
                      style: theme.textTheme.titleMedium,
                    ),
                    const SizedBox(height: AppSpacing.xxs),
                    Text(
                      'Posted by ${widget.chat.taskOwnerName}',
                      style: theme.textTheme.bodySmall?.copyWith(
                        color: theme.colorScheme.onSurfaceVariant,
                      ),
                    ),
                    const SizedBox(height: AppSpacing.md),
                    Expanded(
                      child: ListView.separated(
                        itemCount: messages.length,
                        separatorBuilder: (_, __) =>
                            const SizedBox(height: AppSpacing.sm),
                        itemBuilder: (context, index) {
                          final message = messages[index];
                          return Align(
                            alignment:
                                message.senderId == widget.chat.taskOwnerUserId
                                    ? Alignment.centerLeft
                                    : Alignment.centerRight,
                            child: Container(
                              constraints: const BoxConstraints(maxWidth: 480),
                              padding: const EdgeInsets.symmetric(
                                horizontal: AppSpacing.sm,
                                vertical: AppSpacing.xs,
                              ),
                              decoration: BoxDecoration(
                                color: message.senderId ==
                                        widget.chat.taskOwnerUserId
                                    ? theme.colorScheme.surfaceContainerLow
                                    : theme.colorScheme.primaryContainer,
                                borderRadius: BorderRadius.circular(10),
                              ),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    message.text,
                                    style: theme.textTheme.bodyMedium,
                                  ),
                                  const SizedBox(height: AppSpacing.xxs),
                                  Text(
                                    formatChatTime(message.timestamp),
                                    style: theme.textTheme.bodySmall?.copyWith(
                                      color: theme.colorScheme.onSurfaceVariant,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                          );
                        },
                      ),
                    ),
                    const SizedBox(height: AppSpacing.sm),
                    Row(
                      children: [
                        Expanded(
                          child: TextField(
                            controller: _messageController,
                            textInputAction: TextInputAction.send,
                            onSubmitted: (_) => _send(),
                            decoration: const InputDecoration(
                              hintText: 'Type a message',
                            ),
                          ),
                        ),
                        const SizedBox(width: AppSpacing.xs),
                        FilledButton(
                          onPressed: widget.chatProvider.isSendingMessage
                              ? null
                              : _send,
                          child: Text(
                            widget.chatProvider.isSendingMessage
                                ? '...'
                                : 'Send',
                          ),
                        ),
                      ],
                    ),
                  ],
                );
              },
            ),
          ),
        ),
      ),
    );
  }
}
