import type { Drive } from '../models';
import { env } from './env';

/**
 * Builds a formatted WhatsApp message for a placement drive notification.
 * 
 * Emojis are used for rich aesthetics and clean visual structure.
 */
export function buildDriveMessage(drive: Drive): string {
  const frontendUrl = env.FRONTEND_URL;
  const applyLink = `${frontendUrl}/apply/${drive._id}`;

  const deadlineFormatted = new Date(drive.deadline).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });

  return `📢 *New Placement Drive Alert!*

🏢 *Company:* ${drive.company_name}
💼 *Role:* ${drive.role}
📅 *Deadline:* ${deadlineFormatted}
🔗 *Apply Link:* ${applyLink}

Good luck! 🚀`;
}
