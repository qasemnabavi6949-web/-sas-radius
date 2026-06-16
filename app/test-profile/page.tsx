'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, ChevronDown } from 'lucide-react';

export default function ProfilesNew() {
  const [profiles] = useState([
    { id: 1, name: '128kFUp', price: 0, dlSpeed: 100, ulSpeed: 100, type: 'fup' },
    { id: 2, name: '100mb', price: 0, dlSpeed: 8000, ulSpeed: 4000, type: 'prepaid' },
  ]);

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Data Profiles</h1>
        <Button>
          <Plus className="mr-2 h-4 w-4" /> New Profile
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Profiles List</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Pool Name</TableHead>
                <TableHead>Download Speed</TableHead>
                <TableHead>Upload Speed</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Expiry Time</TableHead>
                <TableHead>Users</TableHead>
                <TableHead>Online Users</TableHead>
                <TableHead>Policies</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {profiles.map((profile) => (
                <TableRow key={profile.id}>
                  <TableCell className="font-medium">{profile.name}</TableCell>
                  <TableCell>{profile.price} AFN</TableCell>
                  <TableCell>-</TableCell>
                  <TableCell>{profile.dlSpeed} Kbps</TableCell>
                  <TableCell>{profile.ulSpeed} Kbps</TableCell>
                  <TableCell>{profile.type}</TableCell>
                  <TableCell>-</TableCell>
                  <TableCell>0</TableCell>
                  <TableCell>0</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm">Policies</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
