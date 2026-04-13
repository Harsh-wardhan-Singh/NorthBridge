class UserModel {
  const UserModel({
    required this.id,
    required this.name,
    required this.bio,
    required this.rating,
    required this.tasksDone,
    required this.location,
    required this.phoneNumber,
    required this.email,
    required this.skills,
    required this.profileImageUrl,
    required this.privatePaymentQrDataUrl,
  });

  final String id;
  final String name;
  final String bio;
  final double rating;
  final int tasksDone;
  final String location;
  final String phoneNumber;
  final String email;
  final List<String> skills;
  final String profileImageUrl;
  final String privatePaymentQrDataUrl;

  factory UserModel.fromJson(Map<String, dynamic> json) {
    return UserModel(
      id: json['id'] as String,
      name: json['name'] as String,
      bio: json['bio'] as String? ?? '',
      rating: (json['rating'] as num).toDouble(),
      tasksDone: (json['tasksDone'] as num?)?.toInt() ?? 0,
      location: json['location'] as String,
      phoneNumber: json['phoneNumber'] as String? ?? '',
      email: json['email'] as String? ?? '',
      skills: (json['skills'] as List<dynamic>? ?? const [])
          .map((item) => item.toString())
          .toList(growable: false),
      profileImageUrl: json['profileImageUrl'] as String? ?? '',
      privatePaymentQrDataUrl: json['privatePaymentQrDataUrl'] as String? ?? '',
    );
  }

  UserModel copyWith({
    String? id,
    String? name,
    String? bio,
    double? rating,
    int? tasksDone,
    String? location,
    String? phoneNumber,
    String? email,
    List<String>? skills,
    String? profileImageUrl,
    String? privatePaymentQrDataUrl,
  }) {
    return UserModel(
      id: id ?? this.id,
      name: name ?? this.name,
      bio: bio ?? this.bio,
      rating: rating ?? this.rating,
      tasksDone: tasksDone ?? this.tasksDone,
      location: location ?? this.location,
      phoneNumber: phoneNumber ?? this.phoneNumber,
      email: email ?? this.email,
      skills: skills ?? this.skills,
      profileImageUrl: profileImageUrl ?? this.profileImageUrl,
      privatePaymentQrDataUrl:
          privatePaymentQrDataUrl ?? this.privatePaymentQrDataUrl,
    );
  }

  Map<String, dynamic> toJson() {
    return {
      'id': id,
      'name': name,
      'bio': bio,
      'rating': rating,
      'tasksDone': tasksDone,
      'location': location,
      'phoneNumber': phoneNumber,
      'email': email,
      'skills': skills,
      'profileImageUrl': profileImageUrl,
      'privatePaymentQrDataUrl': privatePaymentQrDataUrl,
    };
  }
}
