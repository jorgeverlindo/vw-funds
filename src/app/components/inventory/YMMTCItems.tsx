// ─── YMMTCItems ───────────────────────────────────────────────────────────────
// Container for all VehicleRow items inside a DataGrid row expansion.
// Only one VehicleRow's AnglesSource can be open at a time (accordion behaviour).
// The first item starts expanded.

import { useState } from 'react';
import type { AngleKey, VehicleGroup } from '../../../data/inventory/types';
import { VehicleRow } from './VehicleRow';

interface YMMTCItemsProps {
  vehicleGroups: VehicleGroup[];
  /** Fired when user drag-reorders angles in any VehicleRow */
  onAngleReorder?: (groupId: string, order: AngleKey[]) => void;
}

export function YMMTCItems({ vehicleGroups, onAngleReorder }: YMMTCItemsProps) {
  const [expandedId, setExpandedId] = useState<string | null>(
    vehicleGroups.length > 0 ? vehicleGroups[0].id : null,
  );

  if (!vehicleGroups.length) return null;

  const handleToggle = (id: string) => {
    setExpandedId(prev => (prev === id ? null : id));
  };

  return (
    <div>
      {vehicleGroups.map(group => (
        <VehicleRow
          key={group.id}
          group={group}
          isExpanded={expandedId === group.id}
          onToggle={() => handleToggle(group.id)}
          onAngleReorder={order => onAngleReorder?.(group.id, order)}
        />
      ))}
    </div>
  );
}
