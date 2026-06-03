import React from "react";
import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { TagInput } from "@/components/admin/tag-input";

describe("TagInput", () => {
  it("기존 태그를 클릭해 같은 위치에서 수정할 수 있다", () => {
    const handleChange = vi.fn();

    render(
      <TagInput
        label="태그"
        values={["homeserver", "docker-compose", "self-hosting"]}
        suggestions={[]}
        onChange={handleChange}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "homeserver 태그 수정" }));

    const editInput = screen.getByDisplayValue("homeserver");
    fireEvent.change(editInput, { target: { value: "home-server" } });
    fireEvent.keyDown(editInput, { key: "Enter" });

    expect(handleChange).toHaveBeenCalledWith([
      "home-server",
      "docker-compose",
      "self-hosting",
    ]);
  });

  it("수정 중 Escape를 누르면 원래 태그로 되돌아간다", () => {
    const handleChange = vi.fn();

    render(
      <TagInput
        label="태그"
        values={["homeserver", "docker-compose"]}
        suggestions={[]}
        onChange={handleChange}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "homeserver 태그 수정" }));
    const editInput = screen.getByDisplayValue("homeserver");
    fireEvent.change(editInput, { target: { value: "home-server" } });
    fireEvent.keyDown(editInput, { key: "Escape" });

    expect(handleChange).not.toHaveBeenCalled();
    expect(screen.getByText("homeserver")).toBeTruthy();
  });

  it("태그를 드래그해서 순서를 바꿀 수 있다", () => {
    const handleChange = vi.fn();

    render(
      <TagInput
        label="태그"
        values={["homeserver", "docker-compose", "self-hosting", "uptime-kuma"]}
        suggestions={[]}
        onChange={handleChange}
      />
    );

    const draggedTag = screen.getByText("uptime-kuma").closest("span");
    const targetTag = screen.getByText("docker-compose").closest("span");

    expect(draggedTag).toBeTruthy();
    expect(targetTag).toBeTruthy();
    expect(screen.getByRole("button", { name: "uptime-kuma 태그 드래그" })).toBeTruthy();

    fireEvent.dragStart(draggedTag!);
    fireEvent.dragEnter(targetTag!);

    expect(targetTag!.className).toContain("ring-primary");
    expect(screen.getByText("여기에 놓기")).toBeTruthy();

    fireEvent.dragOver(targetTag!);
    fireEvent.drop(targetTag!);

    expect(handleChange).toHaveBeenCalledWith([
      "homeserver",
      "uptime-kuma",
      "docker-compose",
      "self-hosting",
    ]);
  });

  it("드래그 없이 버튼으로 태그 순서를 한 칸씩 바꿀 수 있다", () => {
    const handleChange = vi.fn();

    render(
      <TagInput
        label="태그"
        values={["homeserver", "docker-compose", "self-hosting"]}
        suggestions={[]}
        onChange={handleChange}
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "self-hosting 태그 앞으로 이동" }));

    expect(handleChange).toHaveBeenCalledWith([
      "homeserver",
      "self-hosting",
      "docker-compose",
    ]);
    expect(screen.getByRole("button", { name: "homeserver 태그 앞으로 이동" })).toHaveProperty("disabled", true);
    expect(screen.getByRole("button", { name: "self-hosting 태그 뒤로 이동" })).toHaveProperty("disabled", true);
  });
});
