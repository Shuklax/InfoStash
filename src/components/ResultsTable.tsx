"use client";

import * as React from "react";
import {
  ColumnDef,
  flexRender,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  useReactTable,
} from "@tanstack/react-table";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { useSearchStore } from "@/store/searchStore"; // ✅ pull from store
import ExportViewControls from "./ExportViewControls";

// ---- Types ----
type Company = {
  name: string | null;
  domain: string;
  category: string | null;
  country: string | null;
  city: string | null;
  technologies: number;
};

// ---- Columns ----
const columns: ColumnDef<Company>[] = [
  {
    accessorKey: "name",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Name
      </Button>
    ),
  },
  {
    accessorKey: "domain",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Domain
      </Button>
    ),
  },
  {
    accessorKey: "category",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Category
      </Button>
    ),
  },
  {
    accessorKey: "country",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Country
      </Button>
    ),
  },
  {
    accessorKey: "city",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        City
      </Button>
    ),
  },
  {
    accessorKey: "technologies",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Technologies
      </Button>
    ),
  },
];

export default function ResultsTable() {
  const results = useSearchStore((state) => state.results);
  const [globalFilter, setGlobalFilter] = React.useState("");


  const table = useReactTable({
    data: results,
    columns,
    state: { globalFilter },
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: {
      pagination: {
        pageSize: 10, // default page size
      },
    },
  });

  return (
    <div className="p-5 border-2 rounded-2xl mt-6">
      {/* 🔹 Header: Title + PageSize Select */}
      <div className="flex justify-between items-center mb-3">
        <div className="font-sans font-semibold">Search Results</div>
        <ExportViewControls />
        <div className="mx-2">
          <Select
            value={String(table.getState().pagination.pageSize)}
            onValueChange={(value) => table.setPageSize(Number(value))}
          >
            <SelectTrigger className="w-[120px]">
              <SelectValue placeholder="Page Size" />
            </SelectTrigger>
            <SelectContent className="font-sans">
              {[10, 25, 50, 75, 100].map((size) => (
                <SelectItem key={size} value={String(size)}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Global Filter */}
      <Input
        placeholder="Filter results..."
        value={globalFilter ?? ""}
        onChange={(e) => setGlobalFilter(e.target.value)}
        className="max-w-sm mb-4"
      />

      {/* Table */}
      <div className="overflow-hidden rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>

          <TableBody>
            {table.getRowModel().rows.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow key={row.id}>
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  No results.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex justify-end pt-4">
        <Pagination>
          <PaginationContent>
            {/* Prev */}
            <PaginationItem>
              <PaginationPrevious
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  table.previousPage();
                }}
                className={
                  table.getCanPreviousPage()
                    ? ""
                    : "pointer-events-none opacity-50"
                }
              />
            </PaginationItem>

            {/* Page numbers */}
            {/* Page numbers with smart pagination */}
            {(() => {
              const currentPage = table.getState().pagination.pageIndex;
              const totalPages = table.getPageCount();
              const pages: number[] = [];
              
              if (totalPages <= 5) {
                // Show all pages if 5 or fewer
                for (let i = 0; i < totalPages; i++) {
                  pages.push(i);
                }
              } else {
                // Smart pagination for more than 5 pages
                if (currentPage <= 2) {
                  pages.push(0, 1, 2, 3, -1, totalPages - 1);
                } else if (currentPage >= totalPages - 3) {
                  pages.push(0, -1, totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1);
                } else {
                  pages.push(0, -1, currentPage - 1, currentPage, currentPage + 1, -1, totalPages - 1);
                }
              }
              
              return pages.map((pageIndex, idx) =>
                pageIndex === -1 ? (
                  <PaginationEllipsis key={`ellipsis-${idx}`} />
                ) : (
                  <PaginationItem key={pageIndex}>
                    <PaginationLink
                      href="#"
                      isActive={pageIndex === currentPage}
                      onClick={e => {
                        e.preventDefault();
                        table.setPageIndex(pageIndex);
                      }}
                    >
                      {pageIndex + 1}
                    </PaginationLink>
                  </PaginationItem>
                )
              );
            })()}
            {/* Next */}
            <PaginationItem>
              <PaginationNext
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  table.nextPage();
                }}
                className={
                  table.getCanNextPage() ? "" : "pointer-events-none opacity-50"
                }
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      </div>
    </div>
  );
}
