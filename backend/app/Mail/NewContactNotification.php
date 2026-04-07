<?php

namespace App\Mail;

use App\Models\Contact;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class NewContactNotification extends Mailable
{
    use Queueable, SerializesModels;

    public function __construct(public Contact $contact) {}

    public function envelope(): Envelope
    {
        $subject = $this->contact->profile_type === 'aluno'
            ? '[Fatec-EJ] Novo contato de aluno: ' . $this->contact->name
            : '[Fatec-EJ] Nova mensagem de empresa: ' . $this->contact->name;

        return new Envelope(subject: $subject);
    }

    public function content(): Content
    {
        return new Content(view: 'emails.new-contact');
    }

    public function attachments(): array
    {
        return [];
    }
}
