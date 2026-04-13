import 'package:flutter/material.dart';
import 'package:frontend/core/constants/app_spacing.dart';
import 'package:frontend/services/auth_service.dart';
import 'package:frontend/widgets/user_avatar.dart';

class UserNameWithAvatar extends StatelessWidget {
  const UserNameWithAvatar({
    super.key,
    required this.userId,
    required this.name,
    this.onTap,
  });

  final String userId;
  final String name;
  final VoidCallback? onTap;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return FutureBuilder(
      future: AuthService().getUserById(userId),
      builder: (context, snapshot) {
        final resolvedName = snapshot.data?.name ?? name;
        final imageUrl = snapshot.data?.profileImageUrl ?? '';

        final content = Row(
          mainAxisSize: MainAxisSize.min,
          children: [
            UserAvatar(
              name: resolvedName,
              imageUrl: imageUrl,
              radius: 12,
            ),
            const SizedBox(width: AppSpacing.xxs),
            Flexible(
              child: Text(
                resolvedName,
                style: theme.textTheme.bodySmall?.copyWith(
                  color: theme.colorScheme.onSurfaceVariant,
                ),
                overflow: TextOverflow.ellipsis,
              ),
            ),
          ],
        );

        if (onTap == null) {
          return content;
        }

        return InkWell(
          onTap: onTap,
          borderRadius: BorderRadius.circular(8),
          child: Padding(
            padding: const EdgeInsets.symmetric(vertical: 2),
            child: content,
          ),
        );
      },
    );
  }
}
