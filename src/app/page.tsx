'use client';

import { useSession, signOut } from "next-auth/react";
import { useEffect, useState } from "react";
import axios from "axios";
import { supabase } from "@/lib/supabase";

type Contact = {
  names?: { displayName: string }[];
  emailAddresses?: { value: string }[];
  phoneNumbers?: { value: string }[];
};

export default function HomePage() {
  const { data: session } = useSession();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAndStoreContacts = async () => {
      if (!session?.accessToken || !session?.user?.email) return;

      const { data } = await axios.get(
        'https://people.googleapis.com/v1/people/me/connections',
        {
          params: {
            personFields: 'names,emailAddresses,phoneNumbers',
            pageSize: 10
          },
          headers: {
            Authorization: `Bearer ${session.accessToken}`
          }
        }
      );
      // console.log('Google Contacts:', data);

      const connections: Contact[] = data.connections || [];
      setContacts(connections);

      // Store in Supabase
      for (const person of connections) {
        const name = person.names?.[0]?.displayName;
        const email = person.emailAddresses?.[0]?.value;
        console.log('Name:', name);
        console.log('Email:', email);
       
          const { error } = await supabase.from('contacts').upsert({
            name: name,
            user_id: 1,
            email: email || null,
            phone: person.phoneNumbers?.[0]?.value || null,
            synced_with_google: "true",
          });

          if (error) {
            console.error('Error storing contact:', error);
            setError(error.message);
          }
        
      }
    };

    fetchAndStoreContacts();
  }, [session]);

  if (!session) return <div className="p-4">Loading...</div>;
  

  return (
    <div className="p-6">
      <h1 className="text-2xl font-semibold mb-4">Welcome, {session.user?.name}</h1>
      <button
        className="bg-red-500 text-white px-4 py-2 rounded mb-6"
        onClick={() => signOut()}
      >
        Sign Out
      </button>

      <div className="text-red-500 mb-4">Error: {error}</div>

      <h2 className="text-xl font-medium">Supabase Contacts:</h2>
      <button
        className="bg-blue-500 text-white px-4 py-2 rounded mb-4"
        onClick={async () => {
          const { data, error } = await supabase.from('contacts').select('*');
          if (error) {
        setError(error.message);
          } else {
        console.log('Supabase Records:', data);
        console.log('errpor:', error);
        alert(JSON.stringify(data, null, 2)); // Display records in an alert
          }
        }}
      >
        View Supabase Records
      </button>

      <h2 className="text-xl font-medium">Synced Google Contacts:</h2>
      <ul className="mt-4 space-y-2">
        {contacts.map((person, i) => (
          <li key={i} className="border p-2 rounded">
            <div><strong>Name:</strong> {person.names?.[0]?.displayName}</div>
            <div><strong>Email:</strong> {person.emailAddresses?.[0]?.value}</div>
            <div><strong>Phone Number:</strong> {person.phoneNumbers?.[0]?.value}</div>
          </li>
        ))}
      </ul>
    </div>
  );
}
