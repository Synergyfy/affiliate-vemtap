import { redirect } from 'next/navigation';

export default function HarvestRedirect() {
  redirect('/admin/contacts');
}
