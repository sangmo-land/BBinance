<!DOCTYPE html>
<html>
<head>
    <title>New User Registration</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
    <h1 style="color: #2c3e50;">New User Registration</h1>
<p>A new user has registered on HSBC.</p>
    
    <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
        <p><strong>Name:</strong> {{ $user->name }} {{ $user->surname }}</p>
        <p><strong>Email:</strong> {{ $user->email }}</p>
        <p><strong>Phone:</strong> {{ $user->phone }}</p>
        <p><strong>Language:</strong> {{ $user->spoken_language }}</p>
        <p><strong>Profession:</strong> {{ $user->profession }}</p>
    </div>
    
    <p>Please review their details and approve their account.</p>
    
{{-- <p style="margin-top: 30px;">
        <a href="{{ \Illuminate\Support\Facades\URL::signedRoute('admin.users.approve-link', ['user' => $user->id]) }}" 
           style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
           Approve User Immediately
        </a>
</p> --}}
    
    <p style="margin-top: 20px; font-size: 0.9em; color: #7f8c8d;">
        Note: If you need to check identity documents first, please log in to the <a href="{{ url('/admin') }}">Admin Panel</a>.
    </p>
</body>
</html>
