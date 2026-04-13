import 'dart:convert';
import 'dart:typed_data';

import 'package:flutter/material.dart';
import 'package:frontend/core/constants/app_spacing.dart';
import 'package:frontend/core/utils/device_image_picker.dart';
import 'package:frontend/core/utils/date_time_utils.dart';
import 'package:frontend/models/chat_model.dart';
import 'package:frontend/providers/auth_provider.dart';
import 'package:frontend/providers/chat_provider.dart';
import 'package:frontend/routes/app_routes.dart';
import 'package:frontend/widgets/app_button.dart';
import 'package:frontend/widgets/app_card.dart';
import 'package:frontend/widgets/user_name_with_avatar.dart';

class ChatThreadScreen extends StatefulWidget {
  const ChatThreadScreen({
    super.key,
    required this.chatProvider,
    required this.authProvider,
    required this.chat,
  });

  static const String routeName = '/chat/thread';

  final ChatProvider chatProvider;
  final AuthProvider authProvider;
  final ChatModel chat;

  @override
  State<ChatThreadScreen> createState() => _ChatThreadScreenState();
}

class _ChatThreadScreenState extends State<ChatThreadScreen> {
  final TextEditingController _messageController = TextEditingController();

  String get _currentUserId {
    return widget.authProvider.state.data?.id ??
        widget.chat.users.firstWhere(
          (userId) => userId != widget.chat.taskOwnerUserId,
          orElse: () => widget.chat.taskOwnerUserId,
        );
  }

  String get _fallbackSenderId {
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
      senderId: _currentUserId.isNotEmpty ? _currentUserId : _fallbackSenderId,
      text: text,
    );
  }

  Uint8List? _decodeDataUrl(String? dataUrl) {
    if (dataUrl == null || dataUrl.isEmpty) {
      return null;
    }

    final parts = dataUrl.split(',');
    if (parts.length < 2) {
      return null;
    }

    try {
      return base64Decode(parts.last);
    } catch (_) {
      return null;
    }
  }

  Future<void> _attachImage() async {
    final pickedDataUrl = await pickImageAsDataUrl();
    if (pickedDataUrl == null) {
      return;
    }

    await widget.chatProvider.sendMessage(
      chatId: widget.chat.chatId,
      taskId: widget.chat.taskId,
      senderId: _currentUserId.isNotEmpty ? _currentUserId : _fallbackSenderId,
      text: _messageController.text.trim().isEmpty
          ? 'Image attachment'
          : _messageController.text.trim(),
      imageDataUrl: pickedDataUrl,
    );
    _messageController.clear();
  }

  Future<void> _askForPayment() async {
    final isOwnTask = _currentUserId == widget.chat.taskOwnerUserId;
    if (isOwnTask) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content:
              Text('Ask for payment is only available in accepted-task chats.'),
        ),
      );
      return;
    }

    final user = widget.authProvider.state.data;
    final qrDataUrl = user?.privatePaymentQrDataUrl ?? '';

    if (qrDataUrl.trim().isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Please upload your UPI QR in profile.')),
      );
      return;
    }

    await widget.chatProvider.sendMessage(
      chatId: widget.chat.chatId,
      taskId: widget.chat.taskId,
      senderId: _currentUserId.isNotEmpty ? _currentUserId : _fallbackSenderId,
      text: 'Please complete payment using this UPI QR.',
      imageDataUrl: qrDataUrl,
      isPaymentRequest: true,
    );
  }

  Future<void> _showImagePreview(Uint8List bytes) async {
    await showDialog<void>(
      context: context,
      builder: (context) {
        return Dialog(
          child: InteractiveViewer(
            maxScale: 4,
            child: Image.memory(bytes, fit: BoxFit.contain),
          ),
        );
      },
    );
  }

  Future<void> _reportUser({required String userId}) async {
    final reasonController = TextEditingController();
    String? errorText;

    await showDialog<void>(
      context: context,
      builder: (context) {
        return StatefulBuilder(
          builder: (context, setDialogState) {
            return AlertDialog(
              title: const Text('Report user'),
              content: Column(
                mainAxisSize: MainAxisSize.min,
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Text('Why are you reporting this user?'),
                  const SizedBox(height: AppSpacing.xs),
                  TextField(
                    controller: reasonController,
                    maxLines: 4,
                    decoration: InputDecoration(
                      hintText: 'Enter report reason',
                      errorText: errorText,
                    ),
                  ),
                ],
              ),
              actions: [
                TextButton(
                  onPressed: () => Navigator.of(context).pop(),
                  child: const Text('Cancel'),
                ),
                FilledButton(
                  onPressed: () {
                    final reason = reasonController.text.trim();
                    if (reason.isEmpty) {
                      setDialogState(() {
                        errorText = 'Please enter a reason';
                      });
                      return;
                    }
                    Navigator.of(context).pop();
                    ScaffoldMessenger.of(this.context).showSnackBar(
                      SnackBar(
                        content: Text('Report submitted for $userId.'),
                      ),
                    );
                  },
                  child: const Text('Submit report'),
                ),
              ],
            );
          },
        );
      },
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
                final currentUserId = _currentUserId;
                final isOwnTask = currentUserId == widget.chat.taskOwnerUserId;
                final counterpartUserId = widget.chat.users.firstWhere(
                  (id) => id != currentUserId,
                  orElse: () => widget.chat.taskOwnerUserId,
                );
                final counterpartName =
                    counterpartUserId == widget.chat.taskOwnerUserId
                        ? widget.chat.taskOwnerName
                        : 'User';

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
                    AppCard(
                      child: Padding(
                        padding: AppSpacing.cardPadding,
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Task: ${widget.chat.taskTitle}',
                              style: theme.textTheme.titleMedium,
                            ),
                            const SizedBox(height: AppSpacing.xxs),
                            UserNameWithAvatar(
                              userId: counterpartUserId,
                              name: counterpartName,
                              onTap: () => AppRoutes.goToPublicProfile(
                                context,
                                userId: counterpartUserId,
                              ),
                            ),
                            const SizedBox(height: AppSpacing.xs),
                            OutlinedButton.icon(
                              onPressed: () => _reportUser(
                                userId: counterpartUserId,
                              ),
                              icon: const Icon(Icons.flag_outlined),
                              label: const Text('Report user'),
                            ),
                          ],
                        ),
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
                            alignment: message.senderId == currentUserId
                                ? Alignment.centerRight
                                : Alignment.centerLeft,
                            child: Container(
                              constraints: const BoxConstraints(maxWidth: 480),
                              padding: const EdgeInsets.symmetric(
                                horizontal: AppSpacing.sm,
                                vertical: AppSpacing.xs,
                              ),
                              decoration: BoxDecoration(
                                color: message.senderId == currentUserId
                                    ? theme.colorScheme.primaryContainer
                                    : theme.colorScheme.surfaceContainerLow,
                                borderRadius: BorderRadius.circular(10),
                              ),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  if (message.isPaymentRequest)
                                    Padding(
                                      padding: const EdgeInsets.only(
                                        bottom: AppSpacing.xxs,
                                      ),
                                      child: Text(
                                        'Payment request',
                                        style: theme.textTheme.labelMedium,
                                      ),
                                    ),
                                  Text(
                                    message.text,
                                    style: theme.textTheme.bodyMedium,
                                  ),
                                  if (message.imageDataUrl?.trim().isNotEmpty ==
                                      true) ...[
                                    const SizedBox(height: AppSpacing.xs),
                                    Builder(
                                      builder: (context) {
                                        final bytes = _decodeDataUrl(
                                            message.imageDataUrl);
                                        if (bytes == null) {
                                          return Text(
                                            'Unable to preview image',
                                            style: theme.textTheme.bodySmall,
                                          );
                                        }
                                        return ClipRRect(
                                          borderRadius:
                                              BorderRadius.circular(8),
                                          child: GestureDetector(
                                            onTap: () =>
                                                _showImagePreview(bytes),
                                            child: Image.memory(
                                              bytes,
                                              width: 180,
                                              height: 180,
                                              fit: BoxFit.cover,
                                            ),
                                          ),
                                        );
                                      },
                                    ),
                                  ],
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
                    AppCard(
                      child: Padding(
                        padding: AppSpacing.cardPadding,
                        child: Row(
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
                            IconButton(
                              onPressed: widget.chatProvider.isSendingMessage
                                  ? null
                                  : _attachImage,
                              icon: const Icon(Icons.attach_file),
                              tooltip: 'Attach image',
                            ),
                            const SizedBox(width: AppSpacing.xxs),
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
                      ),
                    ),
                    const SizedBox(height: AppSpacing.xs),
                    Align(
                      alignment: Alignment.centerLeft,
                      child: isOwnTask
                          ? const SizedBox.shrink()
                          : OutlinedButton.icon(
                              onPressed: widget.chatProvider.isSendingMessage
                                  ? null
                                  : _askForPayment,
                              icon: const Icon(Icons.qr_code_2_outlined),
                              label: const Text('Ask for payment'),
                            ),
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
