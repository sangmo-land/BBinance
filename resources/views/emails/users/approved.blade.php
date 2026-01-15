<!DOCTYPE html>
<html>
<head>
    <title>Account Approved</title>
</head>
<body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
    <h1 style="color: #2c3e50;">Congratulations, {{ $user->name }}!</h1>
    
    <div style="background-color: #d4edda; color: #155724; padding: 15px; border-radius: 5px; border: 1px solid #c3e6cb; margin: 20px 0;">
<strong>Your Civicon Exchange account has been approved.</strong>
    </div>

    <p>You can now sign in to your dashboard and start accessing global markets.</p>
    
    <p style="margin-top: 30px;">
        <a href="{{ route('login') }}" 
           style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
Sign In to Civicon Exchange
        </a>
    </p>

    <p style="margin-top: 20px;">If the button above doesn't work, copy and paste this link into your browser:<br>
    <a href="{{ route('login') }}">{{ route('login') }}</a></p>
</body>
</html>
