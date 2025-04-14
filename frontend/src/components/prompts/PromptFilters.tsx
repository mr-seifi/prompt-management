import React from 'react';
import styled from 'styled-components';
import { PromptFilters as FiltersType, Prompt, SortOrder } from '../../types';
import Button from '../ui/Button';

interface PromptFiltersProps {
  filters: FiltersType;
  onFilterChange: (filters: FiltersType) => void;
}

const FiltersContainer = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  align-items: center;
  margin-bottom: 1.5rem;
  padding: 1rem;
  background-color: ${props => props.theme.colors.card};
  border-radius: ${props => props.theme.borderRadius.medium};
  box-shadow: ${props => props.theme.shadows.medium};
`;

const SearchInput = styled.input`
  padding: 0.75rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: ${props => props.theme.borderRadius.small};
  font-size: 1rem;
  flex: 1;
  min-width: 200px;
  background-color: rgba(255, 255, 255, 0.05);
  color: ${props => props.theme.colors.textPrimary};
  
  &:focus {
    outline: none;
    border-color: ${props => props.theme.colors.accent};
    box-shadow: 0 0 0 2px ${props => props.theme.colors.cardHighlight};
  }
`;

const SelectGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const Select = styled.select`
  padding: 0.75rem;
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: ${props => props.theme.borderRadius.small};
  font-size: 1rem;
  background-color: rgba(255, 255, 255, 0.05);
  color: ${props => props.theme.colors.textPrimary};
  
  &:focus {
    outline: none;
    border-color: ${props => props.theme.colors.accent};
  }
`;

const Checkbox = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
`;

const CheckboxInput = styled.input`
  cursor: pointer;
`;

const CheckboxLabel = styled.label`
  cursor: pointer;
  font-weight: 500;
  color: ${props => props.theme.colors.textPrimary};
`;

const PromptFilters: React.FC<PromptFiltersProps> = ({
  filters,
  onFilterChange,
}) => {
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFilterChange({ ...filters, search: e.target.value });
  };

  const handleSortByChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onFilterChange({
      ...filters,
      sortBy: e.target.value as keyof Prompt,
    });
  };

  const handleSortOrderChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onFilterChange({
      ...filters,
      sortOrder: e.target.value as SortOrder,
    });
  };

  const handleFavoritesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFilterChange({
      ...filters,
      favorites: e.target.checked,
    });
  };

  const handleResetFilters = () => {
    onFilterChange({
      search: '',
      sortBy: 'updatedAt',
      sortOrder: SortOrder.DESC,
      favorites: false,
    });
  };

  return (
    <FiltersContainer>
      <SearchInput
        type="text"
        placeholder="Search prompts..."
        value={filters.search || ''}
        onChange={handleSearchChange}
      />

      <SelectGroup>
        <Select
          value={filters.sortBy || 'updatedAt'}
          onChange={handleSortByChange}
        >
          <option value="title">Title</option>
          <option value="createdAt">Created Date</option>
          <option value="updatedAt">Updated Date</option>
        </Select>

        <Select
          value={filters.sortOrder || SortOrder.DESC}
          onChange={handleSortOrderChange}
        >
          <option value={SortOrder.ASC}>Ascending</option>
          <option value={SortOrder.DESC}>Descending</option>
        </Select>
      </SelectGroup>

      <Checkbox>
        <CheckboxInput
          type="checkbox"
          id="favoritesOnly"
          checked={!!filters.favorites}
          onChange={handleFavoritesChange}
        />
        <CheckboxLabel htmlFor="favoritesOnly">
          Favorites only
        </CheckboxLabel>
      </Checkbox>

      <Button 
        variant="secondary" 
        size="small" 
        onClick={handleResetFilters}
      >
        Reset Filters
      </Button>
    </FiltersContainer>
  );
};

export default PromptFilters; 