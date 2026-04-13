import 'package:flutter/material.dart';
import 'package:frontend/core/constants/app_spacing.dart';
import 'package:frontend/models/user_model.dart';
import 'package:frontend/providers/auth_provider.dart';
import 'package:frontend/widgets/app_card.dart';
import 'package:frontend/widgets/user_avatar.dart';

class PublicProfileScreen extends StatelessWidget {
  const PublicProfileScreen({
    super.key,
    required this.authProvider,
    required this.userId,
  });

  static const String routeName = '/profile/public';

  final AuthProvider authProvider;
  final String userId;

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Scaffold(
      appBar: AppBar(
        title: const Text('User Profile'),
      ),
      body: Center(
        child: ConstrainedBox(
          constraints: const BoxConstraints(maxWidth: 720),
          child: Padding(
            padding: AppSpacing.screenPadding,
            child: FutureBuilder<UserModel?>(
              future: authProvider.loadUserById(userId),
              builder: (context, snapshot) {
                if (!snapshot.hasData &&
                    snapshot.connectionState == ConnectionState.waiting) {
                  return const Center(child: CircularProgressIndicator());
                }

                final user = snapshot.data;
                if (user == null) {
                  return Center(
                    child: Text(
                      'User profile not found.',
                      style: theme.textTheme.bodyMedium,
                    ),
                  );
                }

                return AppCard(
                  child: Padding(
                    padding: AppSpacing.cardPadding,
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Row(
                          children: [
                            UserAvatar(
                              name: user.name,
                              imageUrl: user.profileImageUrl,
                              radius: 24,
                            ),
                            const SizedBox(width: AppSpacing.sm),
                            Expanded(
                              child: Text(
                                user.name,
                                style: theme.textTheme.titleLarge,
                              ),
                            ),
                          ],
                        ),
                        const SizedBox(height: AppSpacing.sm),
                        Text(
                          'About',
                          style: theme.textTheme.titleMedium,
                        ),
                        const SizedBox(height: AppSpacing.xs),
                        Text(
                          user.bio.isEmpty ? 'No bio added.' : user.bio,
                          style: theme.textTheme.bodyMedium,
                        ),
                        const SizedBox(height: AppSpacing.sm),
                        Text(
                          'Skills',
                          style: theme.textTheme.titleSmall,
                        ),
                        const SizedBox(height: AppSpacing.xs),
                        Wrap(
                          spacing: AppSpacing.xs,
                          runSpacing: AppSpacing.xs,
                          children: user.skills.isEmpty
                              ? [
                                  Chip(
                                    label: Text(
                                      'No skills listed',
                                      style: theme.textTheme.bodySmall,
                                    ),
                                  ),
                                ]
                              : user.skills
                                  .map((skill) => Chip(label: Text(skill)))
                                  .toList(growable: false),
                        ),
                        const SizedBox(height: AppSpacing.sm),
                        Row(
                          children: [
                            Expanded(
                              child: AppCard(
                                child: Padding(
                                  padding: const EdgeInsets.all(AppSpacing.sm),
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Text('Rating',
                                          style: theme.textTheme.bodySmall),
                                      const SizedBox(height: AppSpacing.xxs),
                                      Text(
                                        user.rating.toStringAsFixed(1),
                                        style: theme.textTheme.titleMedium,
                                      ),
                                    ],
                                  ),
                                ),
                              ),
                            ),
                            const SizedBox(width: AppSpacing.xs),
                            Expanded(
                              child: AppCard(
                                child: Padding(
                                  padding: const EdgeInsets.all(AppSpacing.sm),
                                  child: Column(
                                    crossAxisAlignment: CrossAxisAlignment.start,
                                    children: [
                                      Text('Tasks done',
                                          style: theme.textTheme.bodySmall),
                                      const SizedBox(height: AppSpacing.xxs),
                                      Text(
                                        '${user.tasksDone}',
                                        style: theme.textTheme.titleMedium,
                                      ),
                                    ],
                                  ),
                                ),
                              ),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                );
              },
            ),
          ),
        ),
      ),
    );
  }
}
